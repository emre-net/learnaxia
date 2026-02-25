

import { Queue } from "bullmq";
import IORedis from "ioredis";

let _redisConnection: IORedis | null = null;
export function getRedisConnection() {
    if (!_redisConnection) {
        _redisConnection = new IORedis({
            host: process.env.REDIS_HOST || "localhost",
            port: parseInt(process.env.REDIS_PORT || "6379"),
            password: process.env.REDIS_PASSWORD,
            maxRetriesPerRequest: null,
        });
    }
    return _redisConnection;
}

let _aiQueue: Queue | null = null;
export function getAiQueue() {
    if (!_aiQueue) {
        _aiQueue = new Queue("ai-tasks", {
            connection: getRedisConnection(),
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: "exponential", delay: 1000 },
                removeOnComplete: true,
                removeOnFail: false,
            },
        });
    }
    return _aiQueue;
}
