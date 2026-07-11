import { buildPrompt } from '../src/ai/promptBuilder';
import { cleanAndParseJson, mapBatchWithAI } from '../src/ai/AIService';
import env from '../src/config/env';

// Mock the Gemini API client so we don't hit live endpoints in unit tests
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: jest.fn().mockImplementation(() => {
          return {
            generateContent: jest.fn().mockResolvedValue({
              response: {
                text: () => JSON.stringify([{ name: 'John Doe', email: 'john@example.com' }]),
              },
            }),
          };
        }),
      };
    }),
  };
});

describe('AI Prompt Builder', () => {
  it('should include target fields, enums and input records in the prompt', () => {
    const rawRows = [
      { User: 'John', Contact: 'john@example.com', Phone: '9876543210', Status: 'Hot' },
    ];
    const prompt = buildPrompt(rawRows);
    
    expect(prompt).toContain('created_at');
    expect(prompt).toContain('crm_status');
    expect(prompt).toContain('leads_on_demand');
    expect(prompt).toContain('GOOD_LEAD_FOLLOW_UP');
    expect(prompt).toContain('john@example.com');
  });
});

describe('AI JSON Cleaner & Parser', () => {
  it('should parse simple JSON array text', () => {
    const text = '[{"name": "John"}]';
    const result = cleanAndParseJson(text);
    expect(result).toEqual([{ name: 'John' }]);
  });

  it('should parse single JSON object text as array', () => {
    const text = '{"name": "John"}';
    const result = cleanAndParseJson(text);
    expect(result).toEqual([{ name: 'John' }]);
  });

  it('should strip markdown code blocks and parse', () => {
    const text = '```json\n[{"name": "John"}]\n```';
    const result = cleanAndParseJson(text);
    expect(result).toEqual([{ name: 'John' }]);
  });

  it('should throw error on invalid JSON', () => {
    const text = 'invalid json string';
    expect(() => cleanAndParseJson(text)).toThrow('AI response is not valid JSON array.');
  });
});

describe('AI Service Integration with Groq', () => {
  let originalProvider: string;
  let originalGroqKey: string | undefined;
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    originalProvider = env.AI_PROVIDER;
    originalGroqKey = env.GROQ_API_KEY;
    
    // Setup environment for Groq testing
    (env as any).AI_PROVIDER = 'groq';
    (env as any).GROQ_API_KEY = 'mocked_groq_key';
    
    // Spy on global.fetch
    fetchMock = jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: JSON.stringify([{ name: 'Jane Doe', email: 'jane@example.com' }]),
                },
              },
            ],
          }),
      } as Response)
    );
  });

  afterEach(() => {
    (env as any).AI_PROVIDER = originalProvider;
    (env as any).GROQ_API_KEY = originalGroqKey;
    fetchMock.mockRestore();
  });

  it('should route mapping to Groq and return parsed rows', async () => {
    const rawRows = [{ User: 'Jane', Contact: 'jane@example.com' }];
    const result = await mapBatchWithAI(rawRows, 0);
    
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer mocked_groq_key',
        }),
      })
    );
    expect(result).toEqual([{ name: 'Jane Doe', email: 'jane@example.com' }]);
  });
});

describe('AI Service Integration with Local Mapper', () => {
  let originalProvider: string;

  beforeEach(() => {
    originalProvider = env.AI_PROVIDER;
    (env as any).AI_PROVIDER = 'local';
  });

  afterEach(() => {
    (env as any).AI_PROVIDER = originalProvider;
  });

  it('should successfully map raw rows to CRM Schema locally using heuristics', async () => {
    const rawRows = [
      {
        'Full Name': 'Alice Cooper',
        'E-mail Address': 'alice@example.com',
        'Contact Number': '+91 98765 43210',
        'Lead Status': 'closed won',
        'Notes & Comments': 'Interested in Eden Park projects',
      },
    ];

    const result = await mapBatchWithAI(rawRows, 0);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alice Cooper');
    expect(result[0].email).toBe('alice@example.com');
    expect(result[0].country_code).toBe('+91');
    expect(result[0].mobile_without_country_code).toBe('9876543210');
    expect(result[0].crm_status).toBe('SALE_DONE');
    expect(result[0].data_source).toBe('eden_park');
    expect(result[0].crm_note).toContain('Interested in Eden Park projects');
  });

  it('should invalidate record if both email and mobile are missing', async () => {
    const rawRows = [
      {
        'Full Name': 'Bob Marley',
        'Company Name': 'Reggae Beats',
      },
    ];

    const result = await mapBatchWithAI(rawRows, 0);

    expect(result).toHaveLength(1);
    expect(result[0].crm_status).toBe('BAD_LEAD');
    expect(result[0].crm_note).toContain('SKIPPED: Missing both email and mobile');
  });
});
