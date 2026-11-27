export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { auth } from "@/auth";
import { getMobileUser } from "@/lib/auth/mobile-jwt";
import { AIService } from "@/domains/ai/ai.service";
import { NoteService } from "@/domains/note/note.service";
import { InsufficientTokensError, insufficientTokensResponse, withTokenCharge } from "@/domains/token/token.service";
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

const GenerateNoteSchema = z.object({
    text: z.string().min(10),
    title: z.string().optional(),
    language: z.string().default("tr"),
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
        const authedUserId: string = userId;

        const body = await req.json();
        const { text, title, language } = GenerateNoteSchema.parse(body);

        // S6: Rate limit — saatte 10 AI isteği
        const rateLimit = await checkRateLimit({
            key: `ai-note:${authedUserId}`,
            limit: 10,
            windowMs: 60 * 60 * 1000
        });
        if (!rateLimit.allowed) {
            return NextResponse.json({ error: 'Saatlik AI kullanım limitinize ulaştınız.' }, { status: 429 });
        }

        const { result: note, wallet } = await withTokenCharge(
            authedUserId,
            "AI_NOTE",
            async () => {
                const noteContent = await AIService.generateNote(text, language);
                return NoteService.create(authedUserId, {
                    title: title || "AI Note - " + new Date().toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US'),
                    content: noteContent
                });
            },
            { title: title?.slice(0, 80) }
        );

        return NextResponse.json({ success: true, noteId: note.id, wallet });

    } catch (error: any) {
        if (error instanceof InsufficientTokensError) {
            return insufficientTokensResponse(error);
        }
        console.error("AI Note Generation API Error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Not oluşturulamadı.' }, { status: 500 });
    }
}
