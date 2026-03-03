export const dynamic = 'force-dynamic';

import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getAiQueue } from "@/lib/queue/client";

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

        // 1. Create the Journey Record in DB (Status: GENERATING)
        const journey = await prisma.learningJourney.create({
            data: {
                userId,
                title: `${topic} Journey`,
                topic,
                depth,
                status: "GENERATING",
                syllabus: syllabus,
            }
        });

        // 2. Add to User's Library
        await prisma.userJourneyLibrary.create({
            data: {
                userId,
                journeyId: journey.id,
                role: "OWNER"
            }
        });

        // 3. Push to BullMQ for Background Generative Task
        await getAiQueue().add("generate-journey", {
            userId,
            journeyId: journey.id,
            topic,
            depth,
            syllabus
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
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
