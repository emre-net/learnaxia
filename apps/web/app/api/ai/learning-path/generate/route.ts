import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { AIService } from '@/domains/ai/ai.service';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { topic, goal, depth = 'standard' } = body;

        if (!topic) {
            return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
        }

        // Optional: Implement rate limiting

        const session = await auth();
        // M4: Auth zorunlu
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Bu özelliği kullanmak için giriş yapmalısınız.' }, { status: 401 });
        }

        // S6: Rate limit — saatte 10 AI isteği
        const rateLimitResult = await checkRateLimit({
            key: `ai-journey:${session.user.id}`,
            limit: 10,
            windowMs: 60 * 60 * 1000
        });
        if (!rateLimitResult.allowed) {
            return NextResponse.json({ error: 'Saatlik AI kullanım limitinize ulaştınız. Lütfen bekleyin.' }, { status: 429 });
        }

        let userLang = "tr";
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (user?.language) userLang = user.language;

        const validation = await AIService.validateTopic(topic, userLang);
        if (!validation.isValid) {
            return NextResponse.json({
                error: validation.reason || 'Lütfen öğrenmek istediğiniz konuyu daha net açıklayın. Anlamsız girişler kabul edilmemektedir.'
            }, { status: 400 });
        }

        // 1. Execute Syllabus Generation via AI
        const syllabus = await AIService.generateSyllabus(topic, goal || '', depth, userLang);

        return NextResponse.json({
            success: true,
            syllabus
        });

    } catch (error: unknown) {
        console.error('[LEARNING_PATH_GENERATE_ERROR]:', error);
        return NextResponse.json({ error: 'Internal server error while generating syllabus' }, { status: 500 });
    }
}
