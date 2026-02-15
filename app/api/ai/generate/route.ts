import { auth } from "@/auth";
import { OpenAIService } from "@/lib/ai/openai";
import { WalletService } from "@/domains/wallet/wallet.service";
import { NextResponse } from "next/server";
import { z } from "zod";

import { COSTS } from "@/lib/constants/costs";

const GenerateSchema = z.object({
    topic: z.string().min(3),
    types: z.array(z.enum(['FLASHCARD', 'MC', 'GAP', 'TF'])).default(['FLASHCARD', 'MC', 'GAP', 'TF']),
    count: z.number().min(1).max(20).default(5)
});

const GENERATION_COST = COSTS.AI_GENERATION;

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { topic, types, count } = GenerateSchema.parse(body);
        const userId = session.user.id;

        // 1. Check Balance & Debit
        try {
            await WalletService.debit(userId, GENERATION_COST, 'AI_GENERATION', `Generated content: ${topic}`);
        } catch (error) {
            return NextResponse.json({ error: "Insufficient tokens. Please watch an ad to earn more." }, { status: 402 });
        }

        // 2. Generate Content
        try {
            const items = await OpenAIService.generateModuleContent(topic, types, count);
            return NextResponse.json({ items, remainingTokens: (await WalletService.getBalance(userId)).balance });
        } catch (aiError) {
            // 3. Refund on Failure
            console.error("AI Generation Failed, refunding user:", aiError);
            await WalletService.credit(userId, GENERATION_COST, 'REFUND', `Refund: Generation failed for ${topic}`);
            return NextResponse.json({ error: "Generation failed. Tokens have been refunded." }, { status: 500 });
        }

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
        }
        console.error("Generate API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
