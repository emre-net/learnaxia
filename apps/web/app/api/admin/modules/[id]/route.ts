import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const AdminModulePatchSchema = z.object({
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
    visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
});

async function requireAdmin() {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: new NextResponse("Unauthorized", { status: 401 }) };
    }
    const isAdmin =
        session.user.role === "ADMIN" ||
        session.user.email === process.env.ADMIN_EMAIL;
    if (!isAdmin) {
        return { error: new NextResponse("Forbidden", { status: 403 }) };
    }
    return { userId: session.user.id };
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const guard = await requireAdmin();
        if (guard.error) return guard.error;

        const { id } = await params;
        const body = await req.json();
        const data = AdminModulePatchSchema.parse(body);

        const updated = await prisma.module.update({
            where: { id },
            data: {
                ...(data.status ? { status: data.status } : {}),
                ...(data.status === "ARCHIVED" ? { archivedAt: new Date() } : {}),
                ...(data.status === "ACTIVE" ? { archivedAt: null } : {}),
                ...(data.visibility ? { visibility: data.visibility } : {}),
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid payload", details: error.issues }, { status: 400 });
        }
        console.error("[ADMIN_MODULE_PATCH]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const guard = await requireAdmin();
        if (guard.error) return guard.error;

        const { id } = await params;
        await prisma.module.update({
            where: { id },
            data: { status: "ARCHIVED", archivedAt: new Date() },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[ADMIN_MODULE_DELETE]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
