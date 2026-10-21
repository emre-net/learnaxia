import { auth } from "@/auth";
import { StudyService } from "@/domains/study/study.service";
import { NextResponse } from "next/server";
import { z } from "zod";

const StartSessionSchema = z.object({
    moduleId: z.string(),
    mode: z.enum(['NORMAL', 'WRONG_ONLY', 'SM2', 'REVIEW', 'QUIZ', 'AI_SMART']).default('NORMAL'),
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        const userId = session?.user?.id || null;

        const body = await req.json();
        const { moduleId, mode } = StartSessionSchema.parse(body);

        const studyData = await StudyService.startSession(userId, moduleId, mode);

        return NextResponse.json(studyData);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid Request", details: error.issues }, { status: 400 });
        }
        if (error.message === "Unauthorized Study Access") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (error.message === "Module not found") {
            return NextResponse.json({ error: "Module not found" }, { status: 404 });
        }
        console.error("Start Session Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
