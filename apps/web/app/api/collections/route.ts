
import { auth } from "@/auth";
import { CollectionService } from "@/domains/collection/collection.service";
import { CATEGORIES } from "@learnaxia/shared";
import { NextResponse } from "next/server";
import { z } from "zod";

const CreateCollectionSchema = z.object({
    title: z.string().min(1, "Başlık zorunludur"),
    description: z.string().optional(),
    visibility: z.enum(["PUBLIC", "PRIVATE"]).optional().default("PRIVATE"),
    isPublic: z.boolean().optional(),
    category: z.string().optional(),
    subCategory: z.string().optional(),
}).superRefine((val, ctx) => {
    const isPub = val.isPublic ?? (val.visibility === "PUBLIC");
    if (isPub) {
        if (!val.category || !CATEGORIES[val.category]) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["category"], message: "Herkese açık koleksiyonlar için geçerli kategori seçimi zorunludur." });
        } else if (!val.subCategory || !CATEGORIES[val.category].includes(val.subCategory)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["subCategory"], message: "Geçerli alt kategori seçimi zorunludur." });
        }
    }
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validatedData = CreateCollectionSchema.parse(body);

        const collection = await CollectionService.create(session.user.id, {
            title: validatedData.title,
            description: validatedData.description,
            isPublic: validatedData.isPublic ?? (validatedData.visibility === "PUBLIC"),
            category: validatedData.category,
            subCategory: validatedData.subCategory,
        });

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
        let limit = parseInt(searchParams.get("limit") || "12", 10);
        let offset = parseInt(searchParams.get("offset") || "0", 10);
        if (isNaN(limit) || limit < 1 || limit > 100) limit = 12;
        if (isNaN(offset) || offset < 0) offset = 0;
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
