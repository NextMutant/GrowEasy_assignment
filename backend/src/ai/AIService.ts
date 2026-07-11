import env from '../config/env';
import { buildPrompt } from './promptBuilder';
import { processInBatches } from './batchProcessor';
import logger from '../utils/logger';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Clean markdown formatting from model JSON responses
 */
export const cleanAndParseJson = (text: string): any[] => {
  let cleanText = text.trim();
  
  // Strip ```json ... ``` code blocks
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.substring(7);
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.substring(3);
  }
  
  if (cleanText.endsWith('```')) {
    cleanText = cleanText.substring(0, cleanText.length - 3);
  }
  
  cleanText = cleanText.trim();
  
  try {
    const parsed = JSON.parse(cleanText);
    
    // If it's already an array, return it directly
    if (Array.isArray(parsed)) {
      return parsed;
    }
    
    // Groq's json_object mode often wraps the array inside an object like
    // { "records": [...] } or { "results": [...] } or { "data": [...] }
    // Find the first property whose value is an array and return it.
    if (typeof parsed === 'object' && parsed !== null) {
      for (const key of Object.keys(parsed)) {
        if (Array.isArray(parsed[key])) {
          logger.info(`Extracted array from JSON object key "${key}" (${parsed[key].length} items)`);
          return parsed[key];
        }
      }
    }
    
    // Fallback: wrap single object in array
    return [parsed];
  } catch (error) {
    logger.error('Failed to parse JSON text from AI response. Raw response:\n' + text);
    throw new Error('AI response is not valid JSON array.');
  }
};

/**
 * Maps a single batch of CSV records to CRM schema using Groq API (Llama 3.3 70B) with retry logic.
 */
export const mapBatchWithAI = async (
  batch: Array<Record<string, string>>,
  batchIndex: number,
  retries = 3
): Promise<any[]> => {
  let attempt = 0;
  let waitTime = 2000; // start with 2s

  while (attempt < retries) {
    try {
      const prompt = buildPrompt(batch);
      logger.info(`Sending batch ${batchIndex + 1} to Groq API (attempt ${attempt + 1}/${retries})`);
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: env.GROQ_MODEL,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: {
            type: 'json_object',
          },
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        if (response.status === 429) {
          const resetTokens = response.headers.get('x-ratelimit-reset-tokens') || response.headers.get('retry-after');
          let secondsToWait = 10; // Default fallback delay
          if (resetTokens) {
            const match = resetTokens.match(/([\d.]+)/);
            if (match) {
              secondsToWait = Math.ceil(parseFloat(match[1]));
            }
          } else {
            try {
              const errJson = JSON.parse(errText);
              const message = errJson.error?.message || '';
              const match = message.match(/try again in ([\d.]+s|[\d.]+ seconds|[\d.]+)/i);
              if (match) {
                const numMatch = match[1].match(/([\d.]+)/);
                if (numMatch) {
                  secondsToWait = Math.ceil(parseFloat(numMatch[1]));
                }
              }
            } catch (e) {
              // ignore json parsing error
            }
          }
          const rateLimitErr = new Error(`Rate limit exceeded. Wait ${secondsToWait}s`);
          (rateLimitErr as any).status = 429;
          (rateLimitErr as any).waitTimeMs = secondsToWait * 1000;
          throw rateLimitErr;
        }
        throw new Error(`Groq API returned status ${response.status}: ${errText}`);
      }

      const responseData: any = await response.json();
      const text = responseData.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error('Empty response from Groq API.');
      }

      logger.debug(`Raw Groq response for batch ${batchIndex + 1}: ${text.substring(0, 200)}...`);
      const parsedResults = cleanAndParseJson(text);

      // Ensure the mapped results match the batch size
      if (parsedResults.length !== batch.length) {
        logger.warn(`AI returned ${parsedResults.length} records, but batch size was ${batch.length}. Padding/slicing results to match.`);
        if (parsedResults.length < batch.length) {
          while (parsedResults.length < batch.length) {
            parsedResults.push({});
          }
        } else {
          parsedResults.length = batch.length;
        }
      }

      return parsedResults;
    } catch (error: any) {
      attempt++;
      logger.error(`Error in batch ${batchIndex + 1} (attempt ${attempt}): ${error.message}`);
      
      if (attempt >= retries) {
        throw error;
      }
      
      let waitTimeForThisAttempt = waitTime;
      if (error.status === 429 && error.waitTimeMs) {
        waitTimeForThisAttempt = error.waitTimeMs + 1000; // Add 1 second buffer
        logger.warn(`Rate limit hit (429). Waiting ${waitTimeForThisAttempt / 1000}s before retrying...`);
      } else {
        logger.info(`Waiting ${waitTime / 1000}s before retrying batch ${batchIndex + 1}...`);
      }
      
      await delay(waitTimeForThisAttempt);
      if (error.status !== 429) {
        waitTime *= 2; // only double backoff for non-429 errors
      }
    }
  }

  throw new Error(`Failed to map batch ${batchIndex + 1} after ${retries} attempts.`);
};

/**
 * Orchestrates concurrency-limited batch mapping using Groq.
 */
export const mapRowsWithAI = async (
  rows: Array<Record<string, string>>,
  batchSize = 20,
  concurrencyLimit = 3
): Promise<any[]> => {
  if (rows.length === 0) {
    return [];
  }

  return processInBatches(rows, batchSize, concurrencyLimit, (batch, index) =>
    mapBatchWithAI(batch, index)
  );
};
