"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function ensureAdmin() {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }
}

/**
 * Repairs user libraries by ensuring all modules they should have access to 
 * are actually in their UserModuleLibrary.
 */
export async function repairLibrariesAction() {
    await ensureAdmin();

    try {
        // 1. Get all content access entries (grants of access)
        const allAccess = await prisma.userContentAccess.findMany({
            where: { resourceType: 'MODULE' }
        });

        let repairedCount = 0;

        for (const access of allAccess) {
            // Check if it's already in the library
            const exists = await prisma.userModuleLibrary.findUnique({
                where: {
                    userId_moduleId: {
                        userId: access.userId,
                        moduleId: access.resourceId
                    }
                }
            });

            if (!exists) {
                await prisma.userModuleLibrary.create({
                    data: {
                        userId: access.userId,
                        moduleId: access.resourceId,
                        role: 'OWNER' // Default role for repaired items
                    }
                });
                repairedCount++;
            }
        }

        revalidatePath("/admin");
        return { success: true, message: `${repairedCount} kütüphane kaydı başarıyla onarıldı.` };
    } catch (error) {
        console.error("Repair error:", error);
        return { success: false, message: "Onarırken hata oluştu." };
    }
}

/**
 * Dangerous: Resets only modules and study-related data, keeping users.
 */
export async function resetContentAction() {
    await ensureAdmin();

    try {
        await prisma.$transaction([
            prisma.itemSession.deleteMany({}),
            prisma.learningSession.deleteMany({}),
            prisma.userModuleLibrary.deleteMany({}),
            prisma.userContentAccess.deleteMany({}),
            prisma.item.deleteMany({}),
            prisma.module.deleteMany({}),
        ]);

        revalidatePath("/admin");
        return { success: true, message: "Sistem içerikleri (modüller, oturumlar) başarıyla sıfırlandı." };
    } catch (error) {
        console.error("Reset error:", error);
        return { success: false, message: "Sıfırlarken hata oluştu." };
    }
}
