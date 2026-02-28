export const dynamic = 'force-dynamic';

import { auth } from "@/auth";
import { ModuleService } from "@/domains/module/module.service";
import { NextResponse } from "next/server";
import { z } from "zod";

// Validation Schema
const ItemSchema = z.object({
    content: z.record(z.string(), z.any()),
    order: z.number().optional(),
    type: z.enum(['FLASHCARD', 'MC', 'GAP', 'TRUE_FALSE']).optional(),
});

const CreateModuleSchema = z.object({
    title: z.string().min(1, "Başlık zorunludur").max(100),
    description: z.string().optional(),
    type: z.enum(['FLASHCARD', 'MC', 'GAP', 'TRUE_FALSE']),
    isForkable: z.boolean().optional(),
    status: z.enum(['DRAFT', 'ACTIVE']).optional(),
    items: z.array(ItemSchema).optional(),
    category: z.string().optional(),
    subCategory: z.string().optional(),
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

        const { searchParams } = new URL(req.url);
        const scope = searchParams.get("scope") || "library";
        const search = searchParams.get("search") || "";
        const limit = parseInt(searchParams.get("limit") || "12", 10);
        const offset = parseInt(searchParams.get("offset") || "0", 10);

        const type = searchParams.get("type") || undefined;
        const category = searchParams.get("category") || undefined;
        const role = searchParams.get("role") || "all";

        if (scope === "discover") {
            const modules = await ModuleService.getDiscoverModules(session.user.id, search);
            return NextResponse.json(modules);
        }

        const libraryPayload = await ModuleService.getUserLibrary(session.user.id, limit, offset, { search, type, category, role });
        console.log(`[API/MODULES] Fetched library for user ${session.user.id}. Total: ${libraryPayload.total}`);
        return NextResponse.json(libraryPayload);
    } catch (error) {
        console.error("Get Modules Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
