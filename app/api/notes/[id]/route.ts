import { auth } from "@/auth";
import { NoteService } from "@/domains/note/note.service";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateNoteSchema = z.object({
    title: z.string().optional(),
    content: z.string().min(1, "Note content cannot be empty").optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const validated = updateNoteSchema.parse(body);

        const updatedNote = await NoteService.update(session.user.id, params.id, validated);
        return NextResponse.json(updatedNote);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation Error", details: error.errors }, { status: 400 });
        }
        console.error("Failed to update note:", error);
        return NextResponse.json({ error: "Internal Server Error or Access Denied" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await NoteService.delete(session.user.id, params.id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete note:", error);
        return NextResponse.json({ error: "Internal Server Error or Access Denied" }, { status: 500 });
    }
}
