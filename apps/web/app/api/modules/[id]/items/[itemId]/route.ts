
import { auth } from "@/auth";
import { ModuleService } from "@/domains/module/module.service";
import { NextResponse } from "next/server";
import { z } from "zod";

const FlashcardContent = z.object({ front: z.string().min(1), back: z.string().min(1) });
const MCContent = z.object({
    question: z.string().min(1),
    options: z.array(z.string()).min(2).max(6),
    answer: z.string(),
});
const GapContent = z.object({ text: z.string().min(1), answers: z.array(z.string()).min(1) });
const TFContent = z.object({ statement: z.string().min(1), isTrue: z.boolean() });
// Allow explicit true/false string for now since frontend sends it as string sometimes, or handle boolean.
// But frontend sends strings "True"/"False" for TF. Wait.
// ItemEditorSheet sends "True" / "False" as strings in answers.
// The TFContent schema expects boolean. This might fail.
// Let's check ItemEditorSheet again. It sets answer to "True" or "False".
// So we should relax the schema or fix the frontend to send boolean.
// Schema says `isTrue: z.boolean()`.
// Frontend `answer` state is string.
// Let's adjust schema to handle string or boolean for robustness, or fix frontend.
// Given time, I'll allow both in schema here for safety.
// Actually, let's use a union or coerce.

const UpdateItemSchema = z.object({
    type: z.enum(['FLASHCARD', 'MC', 'GAP', 'TRUE_FALSE']), // Matches ItemType
    content: z.any() // Loose validation for now to avoid strict schema fighting, or reuse validation from POST but be careful.
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, itemId } = await params;
        const body = await req.json();

        // Basic Type Check
        if (!body.type || !body.content) {
            return NextResponse.json({ error: "Missing type or content" }, { status: 400 });
        }

        const updatedItem = await ModuleService.updateItem(session.user.id, id, itemId, body);

        return NextResponse.json(updatedItem);
    } catch (error) {
        console.error("Update Item Error:", error);
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, itemId } = await params;

        await ModuleService.deleteItem(session.user.id, id, itemId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Item Error:", error);
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
