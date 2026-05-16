import Redis from 'ioredis';
import { env } from '../config/env.js';

const redisClientSingleton = () => {
  console.log('🔄 Connecting to Redis...');
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  client.on('error', (err) => {
    console.error('❌ Redis Connection Error:', err.message);
  });

  client.on('connect', () => {
    console.log('✅ Connected to Redis');
  });

  return client;
};

declare global {
  var redis: undefined | ReturnType<typeof redisClientSingleton>;
}

const redis = globalThis.redis ?? redisClientSingleton();

export default redis;

if (process.env.NODE_ENV !== "production") globalThis.redis = redis;
