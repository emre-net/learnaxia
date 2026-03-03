
import { Worker, Job } from "bullmq";
import { getRedisConnection } from "@/lib/queue/client";
import { AIService } from "../ai.service";
import prisma from "@/lib/prisma";
import { WalletService } from "@/domains/wallet/wallet.service";

interface GenerateContentJobData {
    userId: string;
    topic: string;
    types: string[];
    count: number;
    moduleId?: string; // If updating an existing module
}

interface GenerateJourneyJobData {
    userId: string;
    journeyId: string;
    topic: string;
    depth: string;
    syllabus: any[]; // Or a specific type
}

type AIJobData = GenerateContentJobData | GenerateJourneyJobData;

export const aiWorker = new Worker(
    "ai-tasks",
    async (job: Job<AIJobData>) => {
        const { userId, topic } = job.data;
        console.log(`Processing AI job [${job.name}] ${job.id} for user ${userId}: ${topic}`);

        try {
            if (job.name === "generate-journey") {
                const data = job.data as GenerateJourneyJobData;

                // Instantiate the AI provider directly since getProvider is private
                const { OpenAIAIProvider } = await import("../openai.provider");
                const provider = new OpenAIAIProvider();

                // Generate slides sequentially for better coherence and to avoid rate limits
                for (let i = 0; i < data.syllabus.length; i++) {
                    const item = data.syllabus[i];
                    console.log(`Generating slide ${i + 1}/${data.syllabus.length} for journey ${data.journeyId}`);

                    const slideResult = await provider.generateJourneySlide(
                        item.title,
                        data.topic,
                        data.depth
                    );

                    await prisma.learningSlide.create({
                        data: {
                            learningJourneyId: data.journeyId,
                            order: item.order || i + 1,
                            title: slideResult.title,
                            content: slideResult.content,
                            ...(slideResult.peekingQuestion ? { peekingQuestion: slideResult.peekingQuestion as any } : {})
                        }
                    });

                    // Update job progress
                    await job.updateProgress(Math.round(((i + 1) / data.syllabus.length) * 100));
                }

                // Mark journey as ready
                await prisma.learningJourney.update({
                    where: { id: data.journeyId },
                    data: { status: "ACTIVE" }
                });

                return { success: true, journeyId: data.journeyId };
            }
            else {
                // Default handling for "generate-content" or legacy jobs
                const data = job.data as GenerateContentJobData;
                const items = await AIService.generateContent(data.topic, data.types, data.count);

                // 2. Save results (Logic depends on whether it's a new or existing module)
                return { items };
            }

        } catch (error: any) {
            console.error(`AI Worker Error (Job ${job.id} - ${job.name}):`, error);

            if (job.attemptsMade >= (job.opts.attempts || 1)) {
                if (job.name === "generate-journey") {
                    const data = job.data as GenerateJourneyJobData;
                    await WalletService.credit(userId, 10, 'REFUND', `Refund: Async Journey generation failed for ${topic}`);
                    await prisma.learningJourney.update({
                        where: { id: data.journeyId },
                        data: { status: "FAILED" }
                    });
                } else {
                    await WalletService.credit(userId, 5, 'REFUND', `Refund: Async AI generation failed for ${topic}`);
                }
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
