
import { auth } from "@/auth";
import { CollectionService } from "@/domains/collection/collection.service";
import { NextResponse } from "next/server";
import { z } from "zod";

const CreateCollectionSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    visibility: z.enum(["PUBLIC", "PRIVATE"]).optional().default("PRIVATE"),
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
        const validatedData = CreateCollectionSchema.parse(body);

        const collection = await CollectionService.create(session.user.id, validatedData);

        return NextResponse.json(collection, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation Error", details: (error as z.ZodError).issues }, { status: 400 });
        }
        console.error("Create Collection Error:", error);
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
        const limit = parseInt(searchParams.get("limit") || "12", 10);
        const offset = parseInt(searchParams.get("offset") || "0", 10);
        const search = searchParams.get("search") || undefined;
        const category = searchParams.get("category") || undefined;
        const role = searchParams.get("role") || "all";

        const libraryPayload = await CollectionService.findAllUserCollections(session.user.id, limit, offset, { search, category, role });
        return NextResponse.json(libraryPayload);
    } catch (error) {
        console.error("Get Collections Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
