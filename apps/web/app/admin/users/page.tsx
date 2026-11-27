export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { AdminUsersClient } from "./admin-users-client";

export default async function AdminUsersPage() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
            id: true,
            name: true,
            handle: true,
            email: true,
            role: true,
            status: true,
            aiBonusTokens: true,
            createdAt: true,
        },
    });

    const serialized = users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
    }));

    return <AdminUsersClient initialUsers={serialized} />;
}
