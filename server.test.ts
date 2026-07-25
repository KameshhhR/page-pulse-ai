import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from './server';
import axios from 'axios';

// Mock axios to avoid actual network requests during tests
vi.mock('axios');

describe('Page Pulse AI API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return a successful analysis for a valid HTML page', async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Page Title</title>
          <meta name="description" content="This is a test description that is long enough to not get penalized. It needs to be at least 50 characters to avoid the suggestion penalty." />
        </head>
        <body>
          <h1>Main Heading</h1>
          <img src="test.jpg" alt="test image" />
          <p>This is some test content. We need at least a few words here to test the word count logic, though we might still get a penalty for low word count if it is under 300 words. That is fine, we just want to test that it parses correctly.</p>
        </body>
      </html>
    `;

    vi.mocked(axios.get).mockResolvedValue({
      status: 200,
      headers: { 'content-type': 'text/html' },
      data: mockHtml
    });

    const response = await request(app)
      .post('/api/analyze')
      .send({ url: 'https://example.com' });

    expect(response.status).toBe(200);
    expect(response.body.url).toBe('https://example.com');
    expect(response.body.title).toBe('Test Page Title');
    expect(response.body.h1Count).toBe(1);
    expect(response.body.imagesMissingAlt).toBe(0);
    expect(response.body.statusCode).toBe(200);
    expect(response.body.score).toBeGreaterThan(0);
  });

  it('should handle invalid URLs', async () => {
    const response = await request(app)
      .post('/api/analyze')
      .send({ url: '' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid URL provided.');
  });

  it('should handle timeout gracefully', async () => {
    // Simulate axios timeout error
    const timeoutError = new Error('timeout');
    (timeoutError as any).code = 'ECONNABORTED';
    
    vi.mocked(axios.get).mockRejectedValue(timeoutError);

    const response = await request(app)
      .post('/api/analyze')
      .send({ url: 'https://slow-site.com' });

    expect(response.status).toBe(408);
    expect(response.body.error).toMatch(/timed out/i);
  });
});
