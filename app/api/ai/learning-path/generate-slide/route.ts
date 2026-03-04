import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { OpenAIAIProvider } from "@/domains/ai/openai.provider";

const GenerateSlideSchema = z.object({
    journeyId: z.string(),
    topic: z.string(),
    depth: z.string(),
    language: z.string().default("tr"),
    item: z.object({
        order: z.number(),
        title: z.string(),
        overview: z.string().optional(),
    })
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { journeyId, topic, depth, language, item } = GenerateSlideSchema.parse(body);

        // Verify ownership
        const userLibrary = await (prisma as any).userJourneyLibrary.findFirst({
            where: {
                userId: session.user.id,
                journeyId: journeyId,
            }
        });

        if (!userLibrary) {
            return NextResponse.json({ error: "Forbidden. Journey not found." }, { status: 403 });
        }

        // Check if slide already exists (idempotency)
        const existingSlide = await (prisma as any).learningSlide.findFirst({
            where: {
                learningJourneyId: journeyId,
                order: item.order
            }
        });

        if (existingSlide) {
            return NextResponse.json({ success: true, slideId: existingSlide.id, message: "Slide already generated" });
        }

        const provider = new OpenAIAIProvider();

        console.log(`Generating slide ${item.order}: ${item.title}`);

        const slideResult = await provider.generateJourneySlide(
            item.title,
            topic,
            depth,
            language
        );

        const newSlide = await (prisma as any).learningSlide.create({
            data: {
                learningJourneyId: journeyId,
                order: item.order,
                title: slideResult.title,
                content: slideResult.content,
                ...(slideResult.peekingQuestion ? { peekingQuestion: slideResult.peekingQuestion as any } : {})
            }
        });

        return NextResponse.json({
            success: true,
            slideId: newSlide.id
        });

    } catch (error: any) {
        console.error("Generate Slide API Error:", error);

        // Return 500 JSON properly (Vercel won't timeout since this is fast)
        return NextResponse.json({ error: "Slayt üretilirken hata oluştu." }, { status: 500 });
    }
}
