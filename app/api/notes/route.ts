import { auth } from "@/auth";
import { NoteService } from "@/domains/note/note.service";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createNoteSchema = z.object({
    moduleId: z.string().optional(),
    itemId: z.string().optional(),
    title: z.string().optional(),
    content: z.string().min(1, "Note content cannot be empty"),
});

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const moduleId = searchParams.get("moduleId") || undefined;
    const itemId = searchParams.get("itemId") || undefined;

    try {
        const notes = await NoteService.findAll(session.user.id, { moduleId, itemId });
        return NextResponse.json(notes);
    } catch (error) {
        console.error("Failed to fetch notes:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const validated = createNoteSchema.parse(body);

        const note = await NoteService.create(session.user.id, validated);
        return NextResponse.json(note, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation Error", details: error.errors }, { status: 400 });
        }
        console.error("Failed to create note:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
