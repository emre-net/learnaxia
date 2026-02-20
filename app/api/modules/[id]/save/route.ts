
import { auth } from "@/auth";
import { ModuleService } from "@/domains/module/module.service";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const moduleId = params.id;
        const userId = session.user.id;

        // Upsert library entry with 'SAVED' role
        await prisma.userModuleLibrary.upsert({
            where: { userId_moduleId: { userId, moduleId } },
            create: { userId, moduleId, role: 'SAVED', lastInteractionAt: new Date() },
            update: { lastInteractionAt: new Date() } // Keep existing role if already exists (e.g. OWNER)
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Save Module Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const moduleId = params.id;
        const userId = session.user.id;

        // Only delete if it was just 'SAVED', not if they are 'OWNER'
        const entry = await prisma.userModuleLibrary.findUnique({
            where: { userId_moduleId: { userId, moduleId } }
        });

        if (entry && entry.role === 'SAVED') {
            await prisma.userModuleLibrary.delete({
                where: { userId_moduleId: { userId, moduleId } }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Unsave Module Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
