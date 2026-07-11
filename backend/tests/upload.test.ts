import request from 'supertest';
import app from '../src/app';

// Mock ImportService to prevent real Gemini calls during route tests
jest.mock('../src/services/ImportService', () => {
  return {
    processImport: jest.fn().mockResolvedValue({
      imported: [{ name: 'John Doe', email: 'john@example.com' }],
      skipped: [],
      totalImported: 1,
      totalSkipped: 0,
      totalProcessed: 1,
      successRate: 100,
    }),
  };
});

describe('POST /upload', () => {
  beforeAll(() => {
    jest.setTimeout(20000);
  });

  it('should upload CSV successfully', async () => {
    const csvContent = 'name,email,phone\nJohn,john@example.com,1234567890';
    const buffer = Buffer.from(csvContent, 'utf-8');

    const res = await request(app)
      .post('/upload')
      .attach('file', buffer, { filename: 'test.csv', contentType: 'text/csv' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalImported).toBe(1);
    expect(res.body.data.imported).toHaveLength(1);
    expect(res.body.data.imported[0].name).toBe('John Doe');
  });

  it('should reject non-CSV files', async () => {
    const txtContent = 'just some random text';
    const buffer = Buffer.from(txtContent, 'utf-8');

    const res = await request(app)
      .post('/upload')
      .attach('file', buffer, { filename: 'test.txt', contentType: 'text/plain' });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Only CSV files are allowed');
  });

  it('should return error when no file is uploaded', async () => {
    const res = await request(app)
      .post('/upload')
      .send();

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('No file uploaded.');
  });
});
