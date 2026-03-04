import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { generateSyllabus, validateTopic } from '@/lib/ai/providers/openai.provider';
import { calculateAITokensAndCost } from '@/lib/utils/token-calculator';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { topic, goal, depth = 'standard' } = body;

        if (!topic) {
            return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
        }

        // Optional: Implement rate limiting

        // 1. Calculate Cost Estimate
        const inputTokens = calculateAITokensAndCost({
            text: topic + " " + (goal || ""),
            targetCount: depth === "shallow" ? 3 : depth === "standard" ? 5 : 8
        });

        const session = await auth();
        let userLang = "tr";
        if (session?.user?.id) {
            const user = await prisma.user.findUnique({ where: { id: session.user.id } });
            if (user?.language) userLang = user.language;
        }

        // 2. Validate Topic Meaningfulness
        const validation = await validateTopic(topic, userLang);
        if (!validation.isValid) {
            return NextResponse.json({
                error: validation.reason || 'Lütfen öğrenmek istediğiniz konuyu daha net açıklayın. Anlamsız girişler kabul edilmemektedir.'
            }, { status: 400 });
        }

        // 3. Execute Syllabus Generation via AI
        const syllabus = await generateSyllabus(topic, goal || '', depth, userLang);

        return NextResponse.json({
            success: true,
            syllabus,
            metadata: {
                estimatedInputTokens: inputTokens.estimatedInputTokens,
                recommendedCost: inputTokens.recommendedCost
            }
        });

    } catch (error: unknown) {
        console.error('[LEARNING_PATH_GENERATE_ERROR]:', error);
        return NextResponse.json({ error: 'Internal server error while generating syllabus' }, { status: 500 });
    }
}
