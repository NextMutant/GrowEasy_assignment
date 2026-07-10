import { GoogleGenerativeAI } from '@google/generative-ai';
import env from '../config/env';
import { buildPrompt } from './promptBuilder';
import { processInBatches } from './batchProcessor';
import logger from '../utils/logger';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

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
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    logger.error('Failed to parse JSON text from AI response. Raw response:\n' + text);
    throw new Error('AI response is not valid JSON array.');
  }
};

/**
 * Maps a single batch of CSV records to CRM schema using Gemini API with retry logic.
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
      // Use gemini-2.0-flash for speed and cost-effectiveness
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1, // low temperature for structured mapping consistency
        },
      });

      const prompt = buildPrompt(batch);
      
      logger.info(`Sending batch ${batchIndex + 1} to Gemini API (attempt ${attempt + 1}/${retries})`);
      const result = await model.generateContent(prompt);
      
      const text = result.response.text();
      if (!text) {
        throw new Error('Empty response from Gemini API.');
      }

      const parsedResults = cleanAndParseJson(text);
      
      // Ensure the mapped results match the batch size
      if (parsedResults.length !== batch.length) {
        logger.warn(`AI returned ${parsedResults.length} records, but batch size was ${batch.length}. Padding/slicing results to match.`);
        if (parsedResults.length < batch.length) {
          // Pad with empty objects
          while (parsedResults.length < batch.length) {
            parsedResults.push({});
          }
        } else {
          // Slice
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
      
      logger.info(`Waiting ${waitTime}ms before retrying batch ${batchIndex + 1}...`);
      await delay(waitTime);
      waitTime *= 2; // exponential backoff
    }
  }
  
  throw new Error(`Failed to map batch ${batchIndex + 1} after ${retries} attempts.`);
};

/**
 * Orchestrates concurrency-limited batch mapping using Gemini.
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
