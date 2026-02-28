import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
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
                description: 'Bu modül UI testleri için Learnaxia tarafından otomatik oluşturulmuştur. Yeni tasarlanan kart yapılarını, metrikleri ve etiketleri denemek için kullanılır.',
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
                { moduleId: testModule.id, type: 'FLASHCARD', order: 4, contentHash: 'hash4', content: { front: 'G', back: 'H' } },
                { moduleId: testModule.id, type: 'FLASHCARD', order: 5, contentHash: 'hash5', content: { front: 'I', back: 'J' } },
            ]
        });

        // 3. Create a test Collection
        const testCollection = await prisma.collection.create({
            data: {
                title: 'Eğitim Seti 2026',
                description: 'Kapsamlı eğitim kaynakları. Bütün modülleri tek bir koleksiyonda topladık. Premium kart arayüzünde çok şık duracak.',
                visibility: 'PUBLIC',
                isVerified: true,
                ownerId: owner.id,
                category: 'Eğitim Serisi',
                subCategory: 'Tüm Modüller'
            }
        });

        await prisma.collectionItem.create({
            data: { collectionId: testCollection.id, moduleId: testModule.id, order: 1 }
        });

        // 4. Create a test Note
        const testNote = await prisma.note.create({
            data: {
                userId: owner.id,
                title: 'LibraryCard Refactoring Notları',
                content: 'Bugün LibraryCard tasarımını yeniledik. \n\nGlassmorphism ve soft shadow teknikleri kullanarak premium bir his oluşturmaya odaklandık. Ayrıca own-content engellemelerini ekliyoruz. Bu not da aynı zengin arayüz ile Test Notu olarak sunulmaktadır.',
            }
        });

        return NextResponse.json({
            success: true,
            message: "Test verileri basariyla uretildi. Dashboard'dan kontrol edebilirsiniz.",
            data: { module: testModule.id, collection: testCollection.id, note: testNote.id }
        });

    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
