import { getMobileUser } from "@/lib/auth/mobile-jwt";
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
        const user = await getMobileUser(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validatedData = CreateCollectionSchema.parse(body);

        const collection = await CollectionService.create(user.id, validatedData);

        return NextResponse.json(collection, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation Error", details: (error as z.ZodError).issues }, { status: 400 });
        }
        console.error("Create Mobile Collection Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
