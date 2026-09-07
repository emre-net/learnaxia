import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMobileUser } from '@/lib/auth/mobile-jwt';
import { ProgressService } from '@/domains/progress/progress.service';
import { z } from 'zod';

const LogResultSchema = z.object({
    sessionId: z.string(),
    itemId: z.string(),
    quality: z.number().min(0).max(5),
    durationMs: z.number().min(0)
});

export async function POST(req: Request) {
    try {
        const user = await getMobileUser(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { sessionId, itemId, quality, durationMs } = LogResultSchema.parse(body);

        const result = await ProgressService.recordItemResult(
            user.id,
            sessionId,
            itemId,
            { quality, durationMs }
        );

        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid Request', details: error.issues }, { status: 400 });
        }
        console.error('Mobile Log Result Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
