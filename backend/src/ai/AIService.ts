import { GoogleGenerativeAI } from '@google/generative-ai';
import env from '../config/env';
import { buildPrompt } from './promptBuilder';
import { processInBatches } from './batchProcessor';
import logger from '../utils/logger';

// Initialize Gemini client lazily/conditionally
let genAI: GoogleGenerativeAI | null = null;
if (env.AI_PROVIDER === 'gemini' && env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
}

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
 * Maps a single batch of CSV records to CRM schema locally using heuristic rules.
 */
export const mapBatchLocally = (batch: Array<Record<string, string>>): any[] => {
  return batch.map((row) => {
    // Collect all values and lower-case keys for matching
    const rowEntries = Object.entries(row).map(([k, v]) => ({
      key: k.toLowerCase().replace(/[^a-z0-9]/g, ''),
      originalKey: k,
      value: (v || '').trim(),
    }));

    // Find a cell value matching a key pattern
    const getValueByKeywords = (keywords: string[]): string => {
      const match = rowEntries.find((entry) =>
        keywords.some((kw) => entry.key.includes(kw.replace(/[^a-z0-9]/g, '')))
      );
      return match ? match.value : '';
    };

    // 1. Parse Emails
    const emails: string[] = [];
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    rowEntries.forEach((entry) => {
      const matches = entry.value.match(emailRegex);
      if (matches) {
        matches.forEach((m) => {
          if (!emails.includes(m)) emails.push(m);
        });
      }
    });

    let primaryEmail = emails[0] || getValueByKeywords(['email', 'mail']);

    // Fallback: If no email is found, but a website is present, infer a contact email
    if (!primaryEmail) {
      const website = getValueByKeywords(['website', 'url', 'web', 'site', 'link']);
      if (website) {
        try {
          let domain = website.toLowerCase().trim();
          if (domain.startsWith('http://')) domain = domain.substring(7);
          if (domain.startsWith('https://')) domain = domain.substring(8);
          if (domain.startsWith('www.')) domain = domain.substring(4);
          
          domain = domain.split('/')[0].split('?')[0].split(':')[0];
          
          if (domain.includes('.') && domain.length > 4) {
            primaryEmail = `info@${domain}`;
          }
        } catch {
          // Ignore parse errors and keep email empty
        }
      }
    }

    // 2. Parse Phones
    const phones: string[] = [];
    // Clean a phone value to digits
    const cleanPhone = (val: string) => val.replace(/[^0-9+]/g, '');
    rowEntries.forEach((entry) => {
      const isPhoneCol = ['phone', 'mobile', 'contact', 'tel'].some((kw) =>
        entry.key.includes(kw)
      );
      if (isPhoneCol && entry.value) {
        const cleaned = cleanPhone(entry.value);
        if (cleaned.length >= 7 && !phones.includes(cleaned)) {
          phones.push(cleaned);
        }
      }
    });

    // If no phone columns matched, scan all columns for phone-like numeric strings
    if (phones.length === 0) {
      rowEntries.forEach((entry) => {
        const digits = entry.value.replace(/[^0-9]/g, '');
        if (digits.length >= 10 && digits.length <= 15) {
          phones.push(entry.value);
        }
      });
    }

    const primaryPhone = phones[0] || getValueByKeywords(['phone', 'mobile', 'contact']);
    let extractedCountryCode = '';
    let extractedMobile = primaryPhone;

    const commonCodes = ['971', '966', '965', '968', '973', '974', '967', '962', '961', '963', '91', '44', '33', '49', '81', '86', '61', '64', '20', '1', '7'];
    
    if (primaryPhone.startsWith('+')) {
      const remaining = primaryPhone.substring(1);
      const matchedCode = commonCodes.find(code => remaining.startsWith(code));
      if (matchedCode) {
        extractedCountryCode = '+' + matchedCode;
        extractedMobile = remaining.substring(matchedCode.length);
      } else {
        extractedCountryCode = '+' + remaining.substring(0, 2);
        extractedMobile = remaining.substring(2);
      }
    } else {
      const matchedCode = commonCodes.find(code => primaryPhone.startsWith(code));
      if (matchedCode) {
        extractedCountryCode = '+' + matchedCode;
        extractedMobile = primaryPhone.substring(matchedCode.length);
      }
    }
    
    extractedMobile = extractedMobile.replace(/[^0-9]/g, '');

    // 3. Status mapping
    const rawStatus = getValueByKeywords(['status', 'stage', 'lead_status']).toLowerCase();
    let crm_status = 'GOOD_LEAD_FOLLOW_UP';
    if (rawStatus.includes('no') || rawStatus.includes('busy') || rawStatus.includes('wrong') || rawStatus.includes('unreachable') || rawStatus.includes('didnot')) {
      crm_status = 'DID_NOT_CONNECT';
    } else if (rawStatus.includes('bad') || rawStatus.includes('junk') || rawStatus.includes('fake') || rawStatus.includes('invalid') || rawStatus.includes('cold')) {
      crm_status = 'BAD_LEAD';
    } else if (rawStatus.includes('done') || rawStatus.includes('sale') || rawStatus.includes('won') || rawStatus.includes('closed') || rawStatus.includes('deal')) {
      crm_status = 'SALE_DONE';
    }

    // 4. Data source mapping
    const rawSource = getValueByKeywords(['source', 'campaign', 'channel']).toLowerCase().replace(/[^a-z0-9]/g, '');
    let data_source = '';
    const allowedSources = ['leads_ondemand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'];
    let matchedSource = allowedSources.find((src) => {
      const cleanSrc = src.replace(/[^a-z0-9]/g, '');
      return rawSource.includes(cleanSrc);
    });

    if (!matchedSource) {
      rowEntries.forEach((entry) => {
        const valClean = entry.value.toLowerCase().replace(/[^a-z0-9]/g, '');
        const found = allowedSources.find((src) => {
          const cleanSrc = src.replace(/[^a-z0-9]/g, '');
          return valClean.includes(cleanSrc);
        });
        if (found) {
          matchedSource = found;
        }
      });
    }

    if (matchedSource) {
      data_source = matchedSource === 'leads_ondemand' ? 'leads_on_demand' : matchedSource;
    }

    // 5. Build crm_note
    const notesList: string[] = [];
    const rawNote = getValueByKeywords(['note', 'remarks', 'comment', 'feedback']);
    if (rawNote) notesList.push(rawNote);

    if (emails.length > 1) {
      notesList.push(`Additional Emails: ${emails.slice(1).join(', ')}`);
    }
    if (phones.length > 1) {
      notesList.push(`Additional Phones: ${phones.slice(1).join(', ')}`);
    }

    let crm_note = notesList.join(' | ');
    if (!primaryEmail && !extractedMobile) {
      crm_status = 'BAD_LEAD';
      crm_note = `SKIPPED: Missing both email and mobile` + (crm_note ? ` | ${crm_note}` : '');
    }

    // 6. Possession Time
    const possession_time = getValueByKeywords(['possession', 'timeline', 'move']);

    // 7. Created At
    let created_at = getValueByKeywords(['date', 'created', 'time', 'timestamp']);
    if (created_at) {
      const parsedDate = new Date(created_at);
      if (!isNaN(parsedDate.getTime())) {
        created_at = parsedDate.toISOString();
      } else {
        created_at = new Date().toISOString();
      }
    } else {
      created_at = new Date().toISOString();
    }

    return {
      created_at,
      name: getValueByKeywords(['name', 'fullname', 'first', 'last', 'leadname', 'customer']),
      email: primaryEmail,
      country_code: extractedCountryCode || '',
      mobile_without_country_code: extractedMobile,
      company: getValueByKeywords(['company', 'org', 'firm', 'employer', 'legalname', 'legal_name']),
      city: getValueByKeywords(['city', 'town', 'location']),
      state: getValueByKeywords(['state', 'region', 'province']),
      country: getValueByKeywords(['country']),
      lead_owner: getValueByKeywords(['owner', 'sales', 'assigned', 'agent']),
      crm_status,
      crm_note,
      data_source,
      possession_time,
      description: getValueByKeywords(['description', 'desc', 'requirement', 'query', 'message']),
    };
  });
};

/**
 * Maps a single batch of CSV records to CRM schema using Groq API with retry logic.
 */
export const mapBatchWithGroq = async (
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
          model: 'llama-3.3-70b-versatile',
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
        throw new Error(`Groq API returned status ${response.status}: ${errText}`);
      }

      const responseData: any = await response.json();
      const text = responseData.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error('Empty response from Groq API.');
      }

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
      
      logger.info(`Waiting ${waitTime}ms before retrying batch ${batchIndex + 1}...`);
      await delay(waitTime);
      waitTime *= 2; // exponential backoff
    }
  }

  throw new Error(`Failed to map batch ${batchIndex + 1} after ${retries} attempts.`);
};

/**
 * Maps a single batch of CSV records to CRM schema using Gemini API with retry logic.
 */
export const mapBatchWithAI = async (
  batch: Array<Record<string, string>>,
  batchIndex: number,
  retries = 3
): Promise<any[]> => {
  if (env.AI_PROVIDER === 'local') {
    return mapBatchLocally(batch);
  }

  if (env.AI_PROVIDER === 'groq') {
    return mapBatchWithGroq(batch, batchIndex, retries);
  }

  if (!genAI) {
    throw new Error('Gemini API client not initialized. Check your GEMINI_API_KEY configuration.');
  }

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
