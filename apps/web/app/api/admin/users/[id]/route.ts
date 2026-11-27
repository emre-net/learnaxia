import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { TokenService } from "@/domains/token/token.service";
import { z } from "zod";

const AdminUserPatchSchema = z.object({
    status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
    role: z.enum(["USER", "ADMIN"]).optional(),
    grantTokens: z.number().int().min(1).max(500).optional(),
    reason: z.string().max(120).optional(),
});

async function requireAdmin() {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }
    const isAdmin =
        session.user.role === "ADMIN" ||
        (process.env.ADMIN_EMAIL && session.user.email === process.env.ADMIN_EMAIL);
    if (!isAdmin) {
        return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
    return { adminId: session.user.id };
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
        const data = AdminUserPatchSchema.parse(body);

        if (id === guard.adminId && (data.status === "SUSPENDED" || data.role === "USER")) {
            return NextResponse.json(
                { error: "Kendi admin hesabınızı askıya alamaz veya rolünü düşüremezsiniz." },
                { status: 400 }
            );
        }

        if (data.status || data.role) {
            await prisma.user.update({
                where: { id },
                data: {
                    ...(data.status ? { status: data.status } : {}),
                    ...(data.role ? { role: data.role } : {}),
                },
            });
        }

        let wallet = null;
        if (data.grantTokens) {
            wallet = await TokenService.adminGrantTokens(id, data.grantTokens, guard.adminId!, data.reason);
        } else {
            wallet = await TokenService.getWalletSummary(id);
        }

        return NextResponse.json({ success: true, wallet });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Geçersiz veri", details: error.issues }, { status: 400 });
        }
        console.error("PATCH /api/admin/users/[id] error:", error);
        return NextResponse.json({ error: "Kullanıcı güncellenemedi." }, { status: 500 });
    }
}
