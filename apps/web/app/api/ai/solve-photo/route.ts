export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { auth } from "@/auth";
import { AIService } from "@/domains/ai/ai.service";
import { AIError } from "@/domains/ai/ai.interface";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // 0. Rate Limiting
        const limitDetail = await checkRateLimit({
            key: `ai-solve-photo:${userId}`,
            limit: 10, // 10 requests
            windowMs: 60 * 60 * 1000 // per hour
        });

        if (!limitDetail.allowed) {
            return NextResponse.json({
                error: 'Çok fazla resim analizi isteği gönderdiniz. Lütfen bir süre sonra tekrar deneyin.',
                retryAfter: Math.ceil((limitDetail.resetAt.getTime() - Date.now()) / 1000)
            }, { status: 429 });
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

        // Process Request
        let result;
        try {
            const user = await prisma.user.findUnique({ where: { id: session.user.id } });
            const language = user?.language || "tr";

            result = await AIService.solvePhoto(buffer, file.type, language);
        } catch (aiError) {
            console.error("AI Photo Solve Failed:", aiError);
            throw aiError;
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
