import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * GET /api/admin/seed-test
 * Yalnızca geliştirme ortamında çalışır.
 * ADMIN rolü gerektirir.
 */
export async function GET() {
    // ⛔ Production'da tamamen devre dışı
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
            { error: "Bu endpoint production ortamında kullanılamaz." },
            { status: 403 }
        );
    }

    // Auth + ADMIN rol kontrolü
    const session = await auth();
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session?.user?.id || role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // 1. Find or create the 'learnaxia' user
        let owner = await prisma.user.findUnique({ where: { handle: 'learnaxia' } });

        if (!owner) {
            const existingEmail = await prisma.user.findUnique({ where: { email: 'learnaxia@test.com' } });
            if (existingEmail) {
                owner = await prisma.user.update({
                    where: { email: 'learnaxia@test.com' },
                    data: { handle: 'learnaxia' }
                });
            } else {
                owner = await prisma.user.create({
                    data: {
                        name: 'Learnaxia Official',
                        email: 'learnaxia@test.com',
                        handle: 'learnaxia',
                        role: 'ADMIN',
                        status: 'ACTIVE'
                    }
                });
            }
        }

        // 2. Create a test Module
        const testModule = await prisma.module.create({
            data: {
                title: 'İleri Seviye Öğrenme Modülü',
                description: 'Bu modül UI testleri için Learnaxia tarafından otomatik oluşturulmuştur.',
                type: 'FLASHCARD',
                status: 'PUBLISHED',
                visibility: 'PUBLIC',
                isVerified: true,
                ownerId: owner.id,
                creatorId: owner.id,
                category: 'Eğitim',
                subCategory: 'Test'
            }
        });

        await prisma.item.createMany({
            data: [
                { moduleId: testModule.id, type: 'FLASHCARD', order: 1, contentHash: 'hash1', content: { front: 'A', back: 'B' } },
                { moduleId: testModule.id, type: 'FLASHCARD', order: 2, contentHash: 'hash2', content: { front: 'C', back: 'D' } },
                { moduleId: testModule.id, type: 'FLASHCARD', order: 3, contentHash: 'hash3', content: { front: 'E', back: 'F' } },
            ]
        });

        const testCollection = await prisma.collection.create({
            data: {
                title: 'Test Koleksiyonu',
                description: 'Otomatik oluşturulmuş test koleksiyonu.',
                visibility: 'PUBLIC',
                isVerified: true,
                ownerId: owner.id,
                category: 'Test',
                subCategory: 'Genel'
            }
        });

        await prisma.collectionItem.create({
            data: { collectionId: testCollection.id, moduleId: testModule.id, order: 1 }
        });

        return NextResponse.json({
            success: true,
            message: "Test verileri başarıyla üretildi.",
            data: { module: testModule.id, collection: testCollection.id }
        });

    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
