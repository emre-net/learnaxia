export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { auth } from "@/auth";
import { generateSyllabus } from "@/lib/ai/providers/openai.provider";
import { NextResponse } from "next/server";
import { z } from "zod";

const ModifySyllabusSchema = z.object({
    topic: z.string(),
    depth: z.enum(["shallow", "standard", "comprehensive"]).default("standard"),
    instruction: z.string(),
    syllabus: z.array(z.any()), // The existing syllabus to modify
    language: z.string().default("tr")
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { topic, depth, instruction, syllabus, language } = ModifySyllabusSchema.parse(body);

        const modifiedSyllabus = await generateSyllabus(
            topic,
            "", // goal not strictly needed for mods
            depth as any,
            language,
            instruction,
            syllabus
        );

        return NextResponse.json({ syllabus: modifiedSyllabus });

    } catch (error: any) {
        console.error("Modify Syllabus API Error:", error);
        return NextResponse.json({ error: error.message || "Müfredat güncellenemedi." }, { status: 500 });
    }
}
