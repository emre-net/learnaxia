import { NextResponse } from 'next/server';
import { NoteService } from "@/domains/note/note.service";
import { getMobileUser } from '@/lib/auth/mobile-jwt';
import { z } from 'zod';

const createNoteSchema = z.object({
    title: z.string().optional(),
    content: z.string(),
    moduleId: z.string().optional(),
    itemId: z.string().optional(),
    solvedQuestionId: z.string().optional(),
});

export async function GET(req: Request) {
    try {
        const user = await getMobileUser(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(req.url);
        const moduleId = url.searchParams.get('moduleId') || undefined;
        const itemId = url.searchParams.get('itemId') || undefined;
        const solvedQuestionId = url.searchParams.get('solvedQuestionId') || undefined;

        const limitStr = url.searchParams.get('limit');
        const offsetStr = url.searchParams.get('offset');
        const limit = limitStr ? parseInt(limitStr, 10) : 50;
        const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

        const notesPayload = await NoteService.findAll(user.id, { moduleId, itemId, solvedQuestionId }, limit, offset);
        return NextResponse.json(notesPayload);
    } catch (error) {
        console.error("Failed to fetch mobile notes:", error);
        return NextResponse.json(
            { error: "Failed to fetch notes" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const user = await getMobileUser(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const validated = createNoteSchema.parse(body);

        const note = await NoteService.create(user.id, validated);
        return NextResponse.json(note);
    } catch (error) {
        console.error("Failed to create mobile note:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 });
        }
        return NextResponse.json(
            { error: "Failed to create note" },
            { status: 500 }
        );
    }
}
