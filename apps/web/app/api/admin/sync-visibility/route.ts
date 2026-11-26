
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await auth();
        const userRole = (session?.user as any)?.role;
        const userEmail = session?.user?.email;
        const isAdmin =
            session?.user?.handle === 'learnaxia' ||
            userRole === 'ADMIN' ||
            (process.env.ADMIN_EMAIL && userEmail === process.env.ADMIN_EMAIL);

        if (!session?.user || !isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const secret = searchParams.get("secret");
        if (!process.env.SYNC_SECRET || secret !== process.env.SYNC_SECRET) {
            return NextResponse.json({ error: "Invalid secret" }, { status: 403 });
        }

        // Update all modules by learnaxia handle to PUBLIC
        const updatedModules = await prisma.module.updateMany({
            where: {
                owner: { handle: 'learnaxia' },
                visibility: 'PRIVATE' as any
            },
            data: {
                visibility: 'PUBLIC' as any
            }
        });

        // Update all collections by learnaxia handle to PUBLIC
        const updatedCollections = await prisma.collection.updateMany({
            where: {
                owner: { handle: 'learnaxia' },
                visibility: 'PRIVATE' as any
            },
            data: {
                visibility: 'PUBLIC' as any
            }
        });

        return NextResponse.json({
            message: "Sync complete",
            modulesUpdated: updatedModules.count,
            collectionsUpdated: updatedCollections.count
        });

    } catch (error) {
        console.error("Sync Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
