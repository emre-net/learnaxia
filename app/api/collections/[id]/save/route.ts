
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const collectionId = params.id;
        const userId = session.user.id;

        await prisma.userCollectionLibrary.upsert({
            where: { userId_collectionId: { userId, collectionId } },
            create: { userId, collectionId, role: 'SAVED', lastInteractionAt: new Date() },
            update: { lastInteractionAt: new Date() }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Save Collection Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const collectionId = params.id;
        const userId = session.user.id;

        const entry = await prisma.userCollectionLibrary.findUnique({
            where: { userId_collectionId: { userId, collectionId } }
        });

        if (entry && entry.role === 'SAVED') {
            await prisma.userCollectionLibrary.delete({
                where: { userId_collectionId: { userId, collectionId } }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Unsave Collection Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
