import { auth } from "@/auth";
import { NoteService } from "@/domains/note/note.service";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateNoteSchema = z.object({
    title: z.string().optional(),
    content: z.string().min(1, "Note content cannot be empty").optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const validated = updateNoteSchema.parse(body);

        const updatedNote = await NoteService.update(session.user.id, id, validated);
        return NextResponse.json(updatedNote);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 });
        }
        console.error("Failed to update note:", error);
        return NextResponse.json({ error: "Internal Server Error or Access Denied" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        await NoteService.delete(session.user.id, id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete note:", error);
        return NextResponse.json({ error: "Internal Server Error or Access Denied" }, { status: 500 });
    }
}
