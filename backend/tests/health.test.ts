import request from 'supertest';
import app from '../src/app';

describe('GET /health', () => {
  it('should return 200 status and healthy message', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message', 'Server is healthy');
    expect(res.body).toHaveProperty('timestamp');
  });
});
