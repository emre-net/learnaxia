export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { auth } from "@/auth";
import { getMobileUser } from "@/lib/auth/mobile-jwt";
import { AIService } from "@/domains/ai/ai.service";
import { InsufficientTokensError, insufficientTokensResponse, withTokenCharge } from "@/domains/token/token.service";
import { NextResponse } from "next/server";
import { z } from "zod";

const ModifySyllabusSchema = z.object({
    topic: z.string(),
    depth: z.enum(["shallow", "standard", "comprehensive", "deep", "basic"]).default("standard").transform(val => val === "basic" ? "shallow" : val === "deep" ? "comprehensive" : val),
    instruction: z.string(),
    syllabus: z.array(z.any()), // The existing syllabus to modify
    language: z.string().default("tr")
});

export async function POST(req: Request) {
    try {
        let userId: string | undefined;
        const mobileUser = await getMobileUser(req);
        if (mobileUser?.id) {
            userId = mobileUser.id;
        } else {
            const session = await auth();
            if (session?.user?.id) {
                userId = session.user.id;
            }
        }

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { topic, depth, instruction, syllabus, language } = ModifySyllabusSchema.parse(body);

        const { result: modifiedSyllabus, wallet } = await withTokenCharge(
            userId,
            "AI_JOURNEY_MODIFY",
            () => AIService.generateSyllabus(
                topic,
                "",
                depth as any,
                language,
                instruction,
                syllabus
            ),
            { topic: topic.slice(0, 80) }
        );

        return NextResponse.json({ syllabus: modifiedSyllabus, wallet });

    } catch (error: any) {
        if (error instanceof InsufficientTokensError) {
            return insufficientTokensResponse(error);
        }
        console.error("Modify Syllabus API Error:", error);
        return NextResponse.json({ error: "Müfredat güncellenemedi. Lütfen tekrar deneyin." }, { status: 500 });
    }
}
