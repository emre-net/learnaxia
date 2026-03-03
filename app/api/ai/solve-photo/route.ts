export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { auth } from "@/auth";
import { AIService } from "@/domains/ai/ai.service";
import { WalletService } from "@/domains/wallet/wallet.service";
import { AIError } from "@/domains/ai/ai.interface";
import { calculateAITokensAndCost } from "@/lib/utils/token-calculator";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "Lütfen bir dosya yükleyin." }, { status: 400 });
        }

        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "Yalnızca resim dosyaları desteklenmektedir." }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 1. Dynamic Token Calculation & Rate Limit Guardian (Vision specific)
        const tokenEstimate = calculateAITokensAndCost({
            text: file.name, // We use the filename as baseline
            targetCount: 1,  // Usually resolves one question
            isVision: true
        });

        if (tokenEstimate.willHitRateLimit) {
            return NextResponse.json({
                error: "Yüklediğiniz fotoğraf analiz edilemeyecek kadar büyük. Lütfen kırparak tekrar deneyin."
            }, { status: 413 });
        }

        const dynamicCost = tokenEstimate.recommendedCost;

        // 2. Check Balance & Debit
        try {
            await WalletService.debit(session.user.id, dynamicCost, 'AI_SOLVE', `AI Photo Solve: ${file.name} | Cost: ${dynamicCost}`);
        } catch (error) {
            return NextResponse.json({ error: "Yetersiz jeton. Lütfen jeton yükleyin." }, { status: 402 });
        }

        // 3. Process Request
        let result;
        try {
            const user = await prisma.user.findUnique({ where: { id: session.user.id } });
            const language = user?.language || "tr";

            result = await AIService.solvePhoto(buffer, file.type, language);
        } catch (aiError) {
            // 4. Refund on Failure
            console.error("AI Photo Solve Failed, refunding user:", aiError);
            await WalletService.credit(session.user.id, dynamicCost, 'REFUND', `Refund: Photo solve failed`);
            throw aiError; // pass to the outer catch handler
        }

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Solve Photo API Error:", error);

        if (error instanceof AIError) {
            return NextResponse.json({
                error: error.message,
                code: error.code
            }, { status: 422 });
        }

        return NextResponse.json({
            error: "Soru çözülürken bir hata oluştu. Lütfen tekrar deneyin."
        }, { status: 500 });
    }
}
