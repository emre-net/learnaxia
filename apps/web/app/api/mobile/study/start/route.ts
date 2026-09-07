import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMobileUser } from '@/lib/auth/mobile-jwt';
import { StudyService } from '@/domains/study/study.service';
import { z } from 'zod';

const StartSessionSchema = z.object({
    moduleId: z.string(),
    mode: z.enum(['NORMAL', 'WRONG_ONLY', 'SM2', 'REVIEW', 'QUIZ', 'AI_SMART']).default('NORMAL'),
});

export async function POST(req: Request) {
    try {
        const user = await getMobileUser(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { moduleId, mode } = StartSessionSchema.parse(body);

        // Reuse the StudyService logic
        const studyData = await StudyService.startSession(user.id, moduleId, mode);

        return NextResponse.json(studyData);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid Request', details: error.issues }, { status: 400 });
        }
        console.error('Mobile Start Session Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
