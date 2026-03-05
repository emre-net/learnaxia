
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

const CreateItemSchema = z.object({
    type: z.enum(['FLASHCARD', 'MC', 'GAP', 'TF']),
    content: z.union([FlashcardContent, MCContent, GapContent, TFContent])
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const validatedData = CreateItemSchema.parse(body);

        const newItem = await ModuleService.addItem(session.user.id, id, validatedData);

        return NextResponse.json(newItem, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 });
        }
        console.error("Create Item Error:", error);
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
