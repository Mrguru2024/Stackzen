// Only use dotenv in development
if (process.env.NODE_ENV !== 'production') {
  const { config } = require('dotenv');
  config();
}

import { _RedisEdge } from '../lib/redis-edge.ts';
import { RateLimiter } from '../lib/auth/rate-limit.ts';

async function clearRateLimit(ip = '127.0.0.1', type = 'default') {
  const rateLimiter = RateLimiter.getInstance();
  await rateLimiter.resetLimit(type, ip);
  console.log('');
}
