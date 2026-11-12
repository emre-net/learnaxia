import { getMobileUser } from "@/lib/auth/mobile-jwt";
import { CollectionService } from "@/domains/collection/collection.service";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const UpdateCollectionSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
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
        if (!collection) {
            return NextResponse.json({ error: "Collection not found" }, { status: 404 });
        }

        return NextResponse.json(collection);
    } catch (error) {
        console.error("Get Mobile Collection Error:", error);
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

        const updated = await CollectionService.update(user.id, id, {
            ...validated,
            isPublic: validated.visibility ? validated.visibility === "PUBLIC" : undefined
        });

        return NextResponse.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation Error", details: (error as z.ZodError).issues }, { status: 400 });
        }
        console.error("Update Mobile Collection Error:", error);
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

        // Check ownership
        const access = await prisma.userContentAccess.findUnique({
            where: { userId_resourceId: { userId: user.id, resourceId: id } }
        });

        if (!access || access.accessLevel !== 'OWNER') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.$transaction([
            prisma.collectionItem.deleteMany({ where: { collectionId: id } }),
            prisma.userContentAccess.deleteMany({ where: { resourceId: id } }),
            prisma.collection.delete({ where: { id } })
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Mobile Collection Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

