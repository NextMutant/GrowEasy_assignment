import { buildPrompt } from '../src/ai/promptBuilder';
import { cleanAndParseJson } from '../src/ai/AIService';

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
