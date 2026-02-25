
export const dynamic = 'force-dynamic';

import { auth } from "@/auth";
import { AIService } from "@/domains/ai/ai.service";
import { WalletService } from "@/domains/wallet/wallet.service";
import { NextResponse } from "next/server";
import { z } from "zod";
import { COSTS } from "@/lib/constants/costs";
import { getAiQueue } from "@/lib/queue/client";

const GenerateSchema = z.object({
    topic: z.string().min(3),
    types: z.array(z.enum(['FLASHCARD', 'MC', 'GAP', 'TF'])).default(['FLASHCARD', 'MC', 'GAP', 'TF']),
    count: z.number().min(1).max(20).default(5),
    mode: z.enum(['sync', 'async']).default('sync')
});

const GENERATION_COST = COSTS.AI_GENERATION;

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { topic, types, count, mode } = GenerateSchema.parse(body);
        const userId = session.user.id;

        // 1. Check Balance & Debit
        try {
            await WalletService.debit(userId, GENERATION_COST, 'AI_GENERATION', `AI Request: ${topic} (${mode})`);
        } catch (error) {
            return NextResponse.json({ error: "Yetersiz jeton. Lütfen jeton yükleyin." }, { status: 402 });
        }

        // 2. Process Request
        if (mode === 'async') {
            const job = await getAiQueue().add("generate-content", {
                userId,
                topic,
                types,
                count
            });
            return NextResponse.json({
                jobId: job.id,
                message: "İşlem arka planda başlatıldı.",
                remainingTokens: (await WalletService.getBalance(userId)).balance
            });
        }

        try {
            const items = await AIService.generateContent(topic, types, count);
            return NextResponse.json({
                items,
                remainingTokens: (await WalletService.getBalance(userId)).balance
            });
        } catch (aiError) {
            // 3. Refund on Failure
            console.error("AI Generation Failed, refunding user:", aiError);
            await WalletService.credit(userId, GENERATION_COST, 'REFUND', `Refund: Generation failed for ${topic}`);
            return NextResponse.json({ error: "İçerik üretilemedi. Jetonlar iade edildi." }, { status: 500 });
        }

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Geçersiz giriş", details: error.issues }, { status: 400 });
        }
        console.error("Generate API Error:", error);
        return NextResponse.json({ error: "Sunucu hatası oluştu." }, { status: 500 });
    }
}
