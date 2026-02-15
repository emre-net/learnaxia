
import { auth } from "@/auth";
import { ModuleService } from "@/domains/module/module.service";
import { NextResponse } from "next/server";
import { z } from "zod";

// Validation Schema for Update
const UpdateModuleSchema = z.object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    type: z.enum(['FLASHCARD', 'MC', 'GAP']).optional(),
    isForkable: z.boolean().optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional()
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const module = await ModuleService.getById(session.user.id, id);
        if (!module) {
            return NextResponse.json({ error: "Module not found" }, { status: 404 });
        }

        return NextResponse.json(module);
    } catch (error) {
        console.error("Get Module Detail Error:", error);
        if (error instanceof Error && error.message === "Unauthorized Access") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const validatedData = UpdateModuleSchema.parse(body);

        const updatedModule = await ModuleService.update(session.user.id, id, validatedData as any);

        return NextResponse.json(updatedModule);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 });
        }
        console.error("Update Module Error:", error);
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        await ModuleService.archive(session.user.id, id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Archive Module Error:", error);
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
