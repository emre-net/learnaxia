export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { auth } from "@/auth";
import { AIService } from "@/domains/ai/ai.service";
import { NoteService } from "@/domains/note/note.service";
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
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { text, title, language } = GenerateNoteSchema.parse(body);
        const userId = session.user.id;

        // S6: Rate limit — saatte 10 AI isteği
        const rateLimit = await checkRateLimit({
            key: `ai-note:${userId}`,
            limit: 10,
            windowMs: 60 * 60 * 1000
        });
        if (!rateLimit.allowed) {
            return NextResponse.json({ error: 'Saatlik AI kullanım limitinize ulaştınız.' }, { status: 429 });
        }

        // 1. Generate AI Note Content (Markdown/HTML)
        const noteContent = await AIService.generateNote(text, language);

        // 2. Create the Note entry in Database
        const note = await NoteService.create(userId, {
            title: title || "AI Note - " + new Date().toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US'),
            content: noteContent
        });

        return NextResponse.json({ success: true, noteId: note.id });

    } catch (error: any) {
        console.error("AI Note Generation API Error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Not oluşturulamadı.' }, { status: 500 });
    }
}
