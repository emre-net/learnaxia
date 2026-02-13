
import { auth } from "@/auth";
import { CollectionService } from "@/domains/collection/collection.service";
import { NextResponse } from "next/server";
import { z } from "zod";

const UpdateCollectionSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    isPublic: z.boolean().optional(),
    moduleIds: z.array(z.string()).optional()
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const collection = await CollectionService.getById(session.user.id, params.id);
        return NextResponse.json(collection);
    } catch (error) {
        console.error("Get Collection Error:", error);
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        if (error instanceof Error && error.message.includes("not found")) {
            return NextResponse.json({ error: "Not Found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validatedData = UpdateCollectionSchema.parse(body);

        const updatedCollection = await CollectionService.update(session.user.id, params.id, validatedData);

        return NextResponse.json(updatedCollection);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation Error", details: (error as z.ZodError).errors }, { status: 400 });
        }
        console.error("Update Collection Error:", error);
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
