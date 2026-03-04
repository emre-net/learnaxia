const { PrismaClient } = require('@prisma/client');
const IORedis = require('ioredis');

const prisma = new PrismaClient();

async function main() {
    console.log("Checking DB Connection...");
    try {
        const user = await prisma.user.findFirst();
        console.log("DB connection successful! Found user: ", user?.email);
    } catch (err) {
        console.error("DB connection error:", err);
    }

    console.log("Checking Redis Connection...");
    try {
        const redis = new IORedis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || "6379"),
            password: process.env.REDIS_PASSWORD,
            maxRetriesPerRequest: 1,
            connectTimeout: 5000
        });

        redis.on('error', (err) => console.error("Redis Error Event:", err));

        await redis.ping();
        console.log("Redis connection successful!");
        redis.disconnect();
    } catch (err) {
        console.error("Redis connection timeout or error:", err);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
