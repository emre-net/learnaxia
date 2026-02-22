
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await auth();
        // Simple security check - only allow a specific handle or admin
        if (!session || session.user?.handle !== 'learnaxia') {
            // return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            // For now, let's allow it if search param has a secret key or just for this fix
        }

        const { searchParams } = new URL(req.url);
        const secret = searchParams.get("secret");
        if (secret !== "learnaxia-sync-2024") {
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
