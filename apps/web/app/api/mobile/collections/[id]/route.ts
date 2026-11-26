import { getMobileUser } from "@/lib/auth/mobile-jwt";
import { CollectionService } from "@/domains/collection/collection.service";
import { NextResponse } from "next/server";
import { z } from "zod";

const UpdateCollectionSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
    isPublic: z.boolean().optional(),
    category: z.string().optional(),
    subCategory: z.string().optional(),
    moduleIds: z.array(z.string()).optional()
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getMobileUser(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const collection = await CollectionService.getById(user.id, id);
        return NextResponse.json(collection);
    } catch (error) {
        console.error("Get Mobile Collection Error:", error);
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        if (error instanceof Error && error.message.includes("not found")) {
            return NextResponse.json({ error: "Collection not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getMobileUser(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const validated = UpdateCollectionSchema.parse(body);

        const isPublic = validated.isPublic ?? (
            validated.visibility !== undefined ? validated.visibility === "PUBLIC" : undefined
        );

        const updated = await CollectionService.update(user.id, id, {
            title: validated.title,
            description: validated.description,
            isPublic,
            category: validated.category,
            subCategory: validated.subCategory,
            moduleIds: validated.moduleIds,
        });

        return NextResponse.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 });
        }
        console.error("Update Mobile Collection Error:", error);
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getMobileUser(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        await CollectionService.delete(user.id, id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Mobile Collection Error:", error);
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
