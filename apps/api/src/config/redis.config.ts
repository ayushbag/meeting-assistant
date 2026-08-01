import { createRedisConnection, type RedisConnection } from '@repo/redis';
import { env } from './app.config.js';

let redisConnection: RedisConnection | undefined;

/**
 * Returns the singleton Redis connection, creating it lazily on first use.
 * A single ioredis client is designed to be shared across the app (it pools
 * connections), so it should never be instantiated per-request or per-worker.
 */
export const getRedisConnection = (): RedisConnection => {
    if (!redisConnection) {
        redisConnection = createRedisConnection({
            url: env.REDIS_URL,
            maxRetriesPerRequest: null,
        });
    }
    return redisConnection;
};
