import { buildPrompt } from '../src/ai/promptBuilder';
import { cleanAndParseJson, mapBatchWithAI } from '../src/ai/AIService';
import env from '../src/config/env';

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
  let originalGroqKey: string | undefined;
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    originalGroqKey = env.GROQ_API_KEY;
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
    (env as any).GROQ_API_KEY = originalGroqKey;
    fetchMock.mockRestore();
  });

  it('should call Groq API and return parsed rows', async () => {
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
