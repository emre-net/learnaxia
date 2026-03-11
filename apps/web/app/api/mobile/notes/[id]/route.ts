import { NextResponse } from 'next/server';
import { NoteService } from "@/domains/note/note.service";
import { getMobileUser } from '@/lib/auth/mobile-jwt';
import { z } from 'zod';
import prisma from "@/lib/prisma";

const updateNoteSchema = z.object({
    title: z.string().optional(),
    content: z.string().optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getMobileUser(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const note = await prisma.note.findUnique({
            where: { id: resolvedParams.id }
        });

        if (!note || note.userId !== user.id) {
            return NextResponse.json({ message: 'Not found' }, { status: 404 });
        }

        return NextResponse.json(note);
    } catch (error) {
        console.error("Failed to fetch mobile note details:", error);
        return NextResponse.json({ error: "Failed to fetch note" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getMobileUser(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const body = await req.json();
        const validated = updateNoteSchema.parse(body);

        const updatedNote = await NoteService.update(user.id, resolvedParams.id, validated);
        return NextResponse.json(updatedNote);
    } catch (error) {
        console.error("Failed to update mobile note:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getMobileUser(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        await NoteService.delete(user.id, resolvedParams.id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete mobile note:", error);
        return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
    }
}
