export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { auth } from "@/auth";
import { AIService } from "@/domains/ai/ai.service";
import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const GenerateSchema = z.object({
    topic: z.string().min(3),
    types: z.array(z.enum(['FLASHCARD', 'MC', 'GAP', 'TF'])).default(['FLASHCARD', 'MC', 'GAP', 'TF']),
    count: z.number().min(-1).max(30).default(5),
    focusMode: z.enum(['detailed', 'summary', 'key_concepts', 'auto']).optional()
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { topic, types, count, focusMode } = GenerateSchema.parse(body);
        const userId = session.user.id;

        // 1. Process Request
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const language = user?.language || "tr";

        // 2. Validate Topic Meaningfulness
        const validation = await AIService.validateTopic(topic, language);
        if (!validation.isValid) {
            return NextResponse.json({
                error: validation.reason || 'Lütfen içeriğini üretmek istediğiniz konuyu daha net açıklayın. Anlamsız girişler kabul edilmemektedir.'
            }, { status: 400 });
        }

        try {
            const items = await AIService.generateContent(topic, types, count, focusMode, language);
            return NextResponse.json({ items });
        } catch (aiError: any) {
            console.error("AI Generation Failed:", aiError);

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

            return NextResponse.json({ error: aiError.message || "İçerik üretilemedi." }, { status: 500 });
        }

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Geçersiz giriş", details: error.issues }, { status: 400 });
        }
        console.error("Generate API Error:", error);
        return NextResponse.json({ error: "Sunucu hatası oluştu." }, { status: 500 });
    }
}
