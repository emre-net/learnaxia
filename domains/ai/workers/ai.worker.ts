
import { Worker, Job } from "bullmq";
import { getRedisConnection } from "@/lib/queue/client";
import { AIService } from "../ai.service";
import prisma from "@/lib/prisma";
import { WalletService } from "@/domains/wallet/wallet.service";

interface AIJobData {
    userId: string;
    topic: string;
    types: string[];
    count: number;
    moduleId?: string; // If updating an existing module
}

export const aiWorker = new Worker(
    "ai-tasks",
    async (job: Job<AIJobData>) => {
        const { userId, topic, types, count, moduleId } = job.data;
        console.log(`Processing AI job ${job.id} for user ${userId}: ${topic}`);

        try {
            // 1. Generate Content
            const items = await AIService.generateContent(topic, types, count);

            // 2. Save results (Logic depends on whether it's a new or existing module)
            // For now, let's assume we update job data or notify user via status
            // In a real app, you might save this to a 'GenerationResult' table

            return { items };
        } catch (error: any) {
            console.error(`AI Worker Error (Job ${job.id}):`, error);

            // 3. Refund tokens on failure (BullMQ attempts might retry, so handle refund carefully)
            // Only refund on final attempt
            if (job.attemptsMade >= (job.opts.attempts || 1)) {
                await WalletService.credit(userId, 5, 'REFUND', `Refund: Async AI generation failed for ${topic}`);
            }

            throw error; // Let BullMQ handle retry
        }
    },
    { connection: getRedisConnection() }
);

aiWorker.on("completed", (job) => {
    console.log(`Job ${job.id} completed successfully`);
});

aiWorker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
});
