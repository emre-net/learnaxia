import { auth } from "@/auth";
import { getMobileUser } from "@/lib/auth/mobile-jwt";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

async function resolveUserId(req: Request): Promise<string | null> {
    const mobileUser = await getMobileUser(req);
    if (mobileUser?.id) return mobileUser.id;
    const session = await auth();
    return session?.user?.id || null;
}

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const userId = await resolveUserId(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: collectionId } = await props.params;

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
    try {
        const userId = await resolveUserId(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: collectionId } = await props.params;

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
