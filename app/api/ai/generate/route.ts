export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { auth } from "@/auth";
import { AIService } from "@/domains/ai/ai.service";
import { WalletService } from "@/domains/wallet/wallet.service";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAiQueue } from "@/lib/queue/client";
import { calculateAITokensAndCost } from "@/lib/utils/token-calculator";
import prisma from "@/lib/prisma";

const GenerateSchema = z.object({
    topic: z.string().min(3),
    types: z.array(z.enum(['FLASHCARD', 'MC', 'GAP', 'TF'])).default(['FLASHCARD', 'MC', 'GAP', 'TF']),
    count: z.number().min(-1).max(30).default(5),
    mode: z.enum(['sync', 'async']).default('sync'),
    focusMode: z.enum(['detailed', 'summary', 'key_concepts', 'auto']).optional()
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { topic, types, count, mode, focusMode } = GenerateSchema.parse(body);
        const userId = session.user.id;

        // 1. Dynamic Token Calculation & Rate Limit Guardian
        const tokenEstimate = calculateAITokensAndCost({
            text: topic,
            targetCount: count,
            model: "llama-3.3-70b-versatile"
        });

        if (tokenEstimate.willHitRateLimit) {
            return NextResponse.json({
                error: "Gönderdiğiniz metin veya analiz boyutu yapay zeka işlem sınırını aşıyor. Lütfen metninizi kısaltarak tekrar deneyin.",
                estimatedTokens: tokenEstimate.totalTokens
            }, { status: 413 }); // Payload Too Large
        }

        const dynamicCost = tokenEstimate.recommendedCost;

        // 2. Check Balance & Debit
        try {
            await WalletService.debit(userId, dynamicCost, 'AI_GENERATION', `AI Request: ${topic.substring(0, 50)}... (${mode}) | Cost: ${dynamicCost}`);
        } catch (error) {
            return NextResponse.json({ error: "Yetersiz jeton. Lütfen jeton yükleyin." }, { status: 402 });
        }

        // 3. Process Request
        if (mode === 'async') {
            const job = await getAiQueue().add("generate-content", {
                userId,
                topic,
                types,
                count,
                focusMode
            });
            return NextResponse.json({
                jobId: job.id,
                message: "İşlem arka planda başlatıldı.",
                remainingTokens: (await WalletService.getBalance(userId)).balance
            });
        }

        try {
            const items = await AIService.generateContent(topic, types, count, focusMode);
            return NextResponse.json({
                items,
                remainingTokens: (await WalletService.getBalance(userId)).balance
            });
        } catch (aiError: any) {
            // 4. Refund on Failure
            console.error("AI Generation Failed, refunding user:", aiError);
            await WalletService.credit(userId, dynamicCost, 'REFUND', `Refund: Generation failed`);

            await prisma.systemLog.create({
                data: {
                    level: "ERROR",
                    environment: process.env.NODE_ENV || "development",
                    service: "ai",
                    message: "AI Generation Route Error",
                    source: "SERVER",
                    userId: userId,
                    metadata: {
                        error: aiError.message || String(aiError),
                        type: "generation_failure"
                    }
                }
            }).catch(() => { });

            return NextResponse.json({ error: aiError.message || "İçerik üretilemedi. Jetonlar iade edildi." }, { status: 500 });
        }

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Geçersiz giriş", details: error.issues }, { status: 400 });
        }
        console.error("Generate API Error:", error);
        return NextResponse.json({ error: "Sunucu hatası oluştu." }, { status: 500 });
    }
}
