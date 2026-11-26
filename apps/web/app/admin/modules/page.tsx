export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { AdminModulesClient } from "./admin-modules-client";

export default async function AdminModulesPage() {
    const modules = await prisma.module.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            owner: {
                select: { handle: true, email: true },
            },
            _count: {
                select: { items: true },
            },
        },
        take: 100,
    });

    const serialized = modules.map((mod) => ({
        id: mod.id,
        title: mod.title,
        description: mod.description,
        type: mod.type,
        status: mod.status,
        visibility: mod.visibility,
        category: mod.category,
        createdAt: mod.createdAt.toISOString(),
        owner: mod.owner
            ? { handle: mod.owner.handle, email: mod.owner.email }
            : null,
        _count: { items: mod._count.items },
    }));

    return <AdminModulesClient initialModules={serialized} />;
}
