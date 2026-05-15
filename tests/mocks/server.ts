import { setupServer } from 'msw/node';
import { rest } from 'msw';

export const handlers = [
  // Auth endpoints
  rest.post('/api/auth/signin', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: {
          id: '1',
          email: 'test@example.com',
          role: 'user',
        },
      })
    );
  }),

  // System health endpoint
  rest.get('/api/admin/system-health', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        database: 'healthy',
        redis: 'healthy',
        api: 'healthy',
        lastChecked: new Date().toISOString(),
      })
    );
  }),

  // Developer metrics endpoint
  rest.get('/api/developer/refresh-metrics', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        totalErrors: 0,
        recentErrors: [],
        activeUsers: 10,
        systemHealth: {
          database: 'healthy',
          redis: 'healthy',
          api: 'healthy',
        },
        recentDeployments: [],
      })
    );
  }),
];

export const _server = setupServer(...handlers);
