import { Redis } from 'ioredis';
import type { RedisConfig } from './types.js';

export type RedisConnection = Redis;

export const createRedisConnection = (config: RedisConfig): RedisConnection => {
    return new Redis(config.url, {
        // BullMQ requires this to be null, otherwise queue operations throw
        // "Max retries per request is reached" whenever the connection hiccups.
        maxRetriesPerRequest: config.maxRetriesPerRequest ?? null,
    });
};
``