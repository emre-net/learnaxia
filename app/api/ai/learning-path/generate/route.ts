import { NextResponse } from 'next/server';
import { generateSyllabus } from '@/lib/ai/providers/openai.provider';
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

        // 2. Execute Syllabus Generation via AI
        const syllabus = await generateSyllabus(topic, goal || '', depth);

        return NextResponse.json({
            success: true,
            syllabus,
            metadata: {
                estimatedInputTokens: inputTokens.estimatedInputTokens,
            }
        });

    } catch (error: unknown) {
        console.error('[LEARNING_PATH_GENERATE_ERROR]:', error);
        return NextResponse.json({ error: 'Internal server error while generating syllabus' }, { status: 500 });
    }
}
