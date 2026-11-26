import { auth } from "@/auth";
import { getMobileUser } from "@/lib/auth/mobile-jwt";
import { ModuleService } from "@/domains/module/module.service";
import { NextResponse } from "next/server";
import { z } from "zod";

const FlashcardContent = z.union([
    z.object({ front: z.string().min(1), back: z.string().min(1) }),
    z.object({ question: z.string().min(1), answer: z.string().min(1) }),
]);

const MCContent = z.object({
    question: z.string().min(1),
    options: z.array(z.string()).min(2).max(6),
    answer: z.string().min(1),
    explanation: z.string().optional(),
    solution: z.string().optional(),
});

const GapContent = z.object({
    text: z.string().min(1),
    answers: z.array(z.string()).min(1).optional(),
    question: z.string().optional(),
});

const TFContent = z.object({
    statement: z.string().min(1).optional(),
    question: z.string().min(1).optional(),
    isTrue: z.boolean().optional(),
    answer: z.union([z.boolean(), z.string()]).optional(),
    correctAnswer: z.union([z.boolean(), z.string()]).optional(),
    explanation: z.string().optional(),
}).refine((val) => Boolean(val.statement || val.question), {
    message: "Doğru/Yanlış önermesi zorunludur",
});

const CreateItemSchema = z.object({
    type: z.enum(['FLASHCARD', 'MC', 'GAP', 'TRUE_FALSE', 'TF']),
    content: z.union([FlashcardContent, MCContent, GapContent, TFContent, z.record(z.string(), z.any())]),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const mobileUser = await getMobileUser(req);
        const session = mobileUser ? null : await auth();
        const userId = mobileUser?.id || session?.user?.id;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const validatedData = CreateItemSchema.parse(body);

        const normalizedType = validatedData.type === 'TF' ? 'TRUE_FALSE' : validatedData.type;
        const newItem = await ModuleService.addItem(userId, id, {
            type: normalizedType,
            content: validatedData.content,
        });

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
