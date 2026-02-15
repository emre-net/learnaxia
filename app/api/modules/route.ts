
import { auth } from "@/auth";
import { ModuleService } from "@/domains/module/module.service";
import { NextResponse } from "next/server";
import { z } from "zod";

// Validation Schema
const CreateModuleSchema = z.object({
    title: z.string().min(1, "Title is required").max(100),
    description: z.string().optional(),
    type: z.enum(['FLASHCARD', 'MC', 'GAP']),
    isForkable: z.boolean().optional(),
    status: z.enum(['DRAFT', 'ACTIVE']).optional(),
    items: z.array(z.any()).optional()
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validatedData = CreateModuleSchema.parse(body);

        const module = await ModuleService.create(session.user.id, validatedData);

        return NextResponse.json(module, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 });
        }
        console.error("Create Module Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const library = await ModuleService.getUserLibrary(session.user.id);
        return NextResponse.json(library);
    } catch (error) {
        console.error("Get Library Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
