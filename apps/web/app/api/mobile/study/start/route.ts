import { NextResponse } from 'next/server';
import { getMobileUser } from '@/lib/auth/mobile-jwt';
import { StudyService } from '@/domains/study/study.service';
import { getUserSettings } from '@/lib/user-settings';
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

        const [studyData, settings] = await Promise.all([
            StudyService.startSession(user.id, moduleId, mode),
            getUserSettings(user.id),
        ]);

        const itemIds = new Set((studyData.items || []).map((i: any) => i.id));
        const allBookmarked = Array.isArray(settings.bookmarkedItemIds) ? settings.bookmarkedItemIds : [];
        const bookmarkedItemIds = allBookmarked.filter((id) => itemIds.has(id));

        return NextResponse.json({ ...studyData, bookmarkedItemIds });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid Request', details: error.issues }, { status: 400 });
        }
        if (error instanceof Error && error.message.includes('Unauthorized')) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }
        if (error instanceof Error && error.message.includes('not found')) {
            return NextResponse.json({ message: 'Module not found' }, { status: 404 });
        }
        console.error('Mobile Start Session Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
