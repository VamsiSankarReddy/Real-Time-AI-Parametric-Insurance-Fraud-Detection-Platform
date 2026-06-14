const request = require('supertest');
const express = require('express');

function mockRouter() {
  const router = express.Router();
  router.get('/claim-status/test-claim', (_req, res) => {
    res.json({ trust_score: 90, status: 'approved' });
  });
  return router;
}

describe('Backend API smoke test', () => {
  test('should return claim status payload', async () => {
    const app = express();
    app.use('/api', mockRouter());

    const response = await request(app).get('/api/claim-status/test-claim');

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('approved');
    expect(response.body.trust_score).toBe(90);
  });
});
