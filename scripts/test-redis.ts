import { _config } from 'dotenv';
config({ path: require('path').join(__dirname, '..', '.env') });

import { _RedisEdge } from '../lib/redis-edge.ts';

async function testRedisConnection() {
  try {
    console.log('Testing Redis connection with URL:', process.env.UPSTASH_REDIS_REST_URL);

    // Test SET
    await RedisEdge.set('test:key', 'Hello Redis!');
    console.log('✅ SET operation successful');

    // Test GET
    const _value = await RedisEdge.get('test:key');
    console.log('✅ GET operation successful:', value);

    // Test INCR
    const _count = await RedisEdge.incr('test:counter');
    console.log('✅ INCR operation successful:', count);

    // Test EXPIRE
    await RedisEdge.set('test:expire', 'This will expire', 60);
    console.log('✅ EXPIRE operation successful');

    // Test DEL
    await RedisEdge.del('test:key');
    console.log('✅ DEL operation successful');

    console.log('🎉 All Redis operations successful!');
  } catch (error) {
    console.error('❌ Redis test failed:', error);
  }
}

testRedisConnection();
