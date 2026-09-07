export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { getMobileUser } from "@/lib/auth/mobile-jwt";
import { AIService } from "@/domains/ai/ai.service";
import { NoteService } from "@/domains/note/note.service";
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

const GenerateNoteSchema = z.object({
    text: z.string().min(10),
    title: z.string().optional(),
    // K1+M4: Sadece desteklenen dil kodları — enum garantisi
    language: z.enum(["tr", "en"]).default("tr"),
});

export async function POST(req: Request) {
    try {
        const user = await getMobileUser(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // K1: Rate Limiting — kullanıcı başına saatte 10 AI not üretimi
        const rateLimit = await checkRateLimit({
            key: `mobile-generate-note:${user.id}`,
            limit: 10,
            windowMs: 60 * 60 * 1000 // 1 saat
        });

        if (!rateLimit.allowed) {
            return NextResponse.json({
                error: "Çok fazla not üretimi isteği. Lütfen bir süre bekleyin.",
                retryAfter: Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)
            }, { status: 429 });
        }

        const body = await req.json();
        const { text, title, language } = GenerateNoteSchema.parse(body);
        const userId = user.id;

        // 1. Generate AI Note Content
        const noteContent = await AIService.generateNote(text, language);

        // 2. Create the Note entry
        const note = await NoteService.create(userId, {
            title: title || "AI Not - " + new Date().toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US'),
            content: noteContent
        });

        return NextResponse.json({ success: true, noteId: note.id });

    } catch (error: any) {
        console.error("Mobile AI Note Generation Error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Not üretilemedi. Lütfen tekrar deneyin." }, { status: 500 });
    }
}
