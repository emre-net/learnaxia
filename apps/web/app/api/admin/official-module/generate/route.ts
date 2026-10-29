export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";
import { OfficialModuleGeneratorService, QuestionType } from "@/domains/ai/official-generator.service";

const RequestSchema = z.object({
    topic: z.string().min(3, "Konu en az 3 karakter olmalıdır"),
    type: z.enum(['FLASHCARD', 'MC', 'TRUE_FALSE', 'GAP', 'AUTO']).optional().default('AUTO'),
    count: z.number().min(3).max(25).optional().default(8),
    language: z.enum(['tr', 'en']).optional().default('tr')
});

function isAuthorized(req: Request, session: any): boolean {
    // 1. Check Session Admin Role
    if (session?.user && (session.user.role === 'ADMIN' || session.user.handle === 'learnaxia')) {
        return true;
    }

    // 2. Check Admin Secret Header (CLI / Script / Automation)
    const secretHeader = req.headers.get("x-admin-secret");
    const allowedSecrets = [
        process.env.AUTH_SECRET,
        process.env.SYNC_SECRET,
        process.env.ADMIN_PASSWORD
    ].filter(Boolean);

    if (secretHeader && allowedSecrets.includes(secretHeader)) {
        return true;
    }

    return false;
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!isAuthorized(req, session)) {
            return NextResponse.json(
                { error: "Yetkisiz erişim. Sadece sistem yöneticileri bu işlemi gerçekleştirebilir." },
                { status: 401 }
            );
        }

        const body = await req.json();
        const parsed = RequestSchema.parse(body);

        const result = await OfficialModuleGeneratorService.generateAndPublish({
            topic: parsed.topic,
            type: parsed.type as (QuestionType | 'AUTO'),
            count: parsed.count,
            language: parsed.language
        });

        return NextResponse.json({
            success: true,
            message: `"${result.title}" modülü LearnAxia Official adına başarıyla yayınlandı.`,
            module: result
        });

    } catch (error: any) {
        console.error("[Official Module Generator Error]:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Geçersiz giriş parametreleri", details: error.issues }, { status: 400 });
        }
        return NextResponse.json(
            { error: error.message || "Modül üretilirken beklenmeyen bir hata oluştu." },
            { status: 500 }
        );
    }
}
