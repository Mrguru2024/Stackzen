import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { createMocks } from 'node-mocks-http';
import { POST, GET } from '@/app/api/feedback/route';
import { prisma } from '@/lib/prisma';
import { createTestUser, deleteTestUser } from '../utils/test-utils.ts';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

describe('Feedback API', () => {
  let testUser: any;
  let server: any;

  beforeAll(async () => {
    await app.prepare();
    server = createServer((req, res) => {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    });
    server.listen(3000);

    // Create test user
    testUser = await createTestUser();
  });

  afterAll(async () => {
    await deleteTestUser(testUser.id);
    server.close();
  });

  describe('POST /api/feedback', () => {
    it('should create new feedback', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          timeSpent: '2 hours',
          featuresUsed: ['Income', 'Expenses'],
          performance: {
            pageLoadTimes: 'Fast',
            responseTimes: 'Average',
            lagFreezing: false,
          },
          deviceInfo: {
            deviceType: 'Desktop',
            browser: 'Chrome',
            os: 'macOS',
          },
          suggestions: 'Great app!',
          rating: 5,
        },
      });

      // Mock session
      req.session = {
        user: {
          id: testUser.id,
          email: testUser.email,
        },
      };

      await POST(req);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toHaveProperty('id');
      expect(data.timeSpent).toBe('2 hours');
      expect(data.rating).toBe(5);
    });

    it('should validate feedback data', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          timeSpent: '2 hours',
          featuresUsed: ['Income'],
          performance: {
            pageLoadTimes: 'Fast',
            responseTimes: 'Average',
            lagFreezing: false,
          },
          deviceInfo: {
            deviceType: 'Desktop',
            browser: 'Chrome',
            os: 'macOS',
          },
          suggestions: 'Great app!',
          rating: 6, // Invalid rating
        },
      });

      // Mock session
      req.session = {
        user: {
          id: testUser.id,
          email: testUser.email,
        },
      };

      await POST(req);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data).toHaveProperty('error');
    });
  });

  describe('GET /api/feedback', () => {
    it('should get user feedback with pagination', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          page: '1',
          limit: '10',
        },
      });

      // Mock session
      req.session = {
        user: {
          id: testUser.id,
          email: testUser.email,
        },
      };

      await GET(req);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toHaveProperty('feedback');
      expect(data).toHaveProperty('pagination');
      expect(data.pagination).toHaveProperty('total');
      expect(data.pagination).toHaveProperty('pages');
      expect(data.pagination).toHaveProperty('current');
    });

    it('should require authentication', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          page: '1',
          limit: '10',
        },
      });

      await GET(req);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data).toHaveProperty('error');
    });
  });
});
