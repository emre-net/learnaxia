export const dynamic = 'force-dynamic';

import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getAiQueue } from "@/lib/queue/client";
import { validateTopic } from "@/lib/ai/providers/openai.provider";

const StartJourneySchema = z.object({
    topic: z.string().min(2),
    depth: z.enum(["shallow", "standard", "deep"]).default("standard"),
    syllabus: z.array(z.object({
        order: z.number(),
        title: z.string(),
        overview: z.string(),
        estimatedMinutes: z.number()
    })).min(1)
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { topic, depth, syllabus } = StartJourneySchema.parse(body);
        const userId = session.user.id;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        const language = user?.language || "tr";

        // 1. Validate Topic Meaningfulness
        const validation = await validateTopic(topic, language);
        if (!validation.isValid) {
            return NextResponse.json({
                error: validation.reason || 'Lütfen öğrenmek istediğiniz konuyu daha net açıklayın. Anlamsız girişler kabul edilmemektedir.'
            }, { status: 400 });
        }

        // 2. Create the Journey Record in DB (Status: GENERATING)
        const journey = await (prisma as any).learningJourney.create({
            data: {
                userId,
                title: `${topic} Journey`,
                topic,
                depth,
                status: "GENERATING",
                syllabus: syllabus,
            }
        });

        // 3. Add to User's Library
        await (prisma as any).userJourneyLibrary.create({
            data: {
                userId,
                journeyId: journey.id,
                role: "OWNER"
            }
        });

        // 4. Push to BullMQ for Background Generative Task
        await getAiQueue().add("generate-journey", {
            userId,
            journeyId: journey.id,
            topic,
            depth,
            syllabus,
            language
        });

        return NextResponse.json({
            success: true,
            journeyId: journey.id,
            message: "Journey creation started in background"
        });

    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid schema", details: error.issues }, { status: 400 });
        }

        console.error("Start Journey API Error:", error);

        const errorMsg = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu";
        const stackTrace = error instanceof Error ? error.stack : undefined;

        try {
            // Hata kaydını sistem loglarına düşür (Admin Dashboard için)
            await prisma.systemLog.create({
                data: {
                    requestId: crypto.randomUUID(),
                    level: "ERROR",
                    environment: process.env.NODE_ENV || "development",
                    service: "journey-api",
                    message: "Yolculuk (Journey) oluşturulurken kritik hata: " + errorMsg,
                    source: "SERVER",
                    stack: stackTrace
                }
            });
        } catch (logErr) {
            console.error("Failed to write to systemLog:", logErr);
        }

        return NextResponse.json({ error: "Sunucu hatası: Yolculuk başlatılamadı. (" + errorMsg + ")" }, { status: 500 });
    }
}
