import { auth } from "@/auth";
import { ProgressService } from "@/domains/progress/progress.service";
import { NextResponse } from "next/server";
import { z } from "zod";

const LogResultSchema = z.object({
    sessionId: z.string(),
    itemId: z.string(),
    quality: z.number().min(0).max(5),
    durationMs: z.number().min(0)
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { sessionId, itemId, quality, durationMs } = LogResultSchema.parse(body);

        const result = await ProgressService.recordItemResult(
            session.user.id,
            sessionId,
            itemId,
            { quality, durationMs }
        );

        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid Request", details: error.issues }, { status: 400 });
        }
        console.error("Log Result Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
