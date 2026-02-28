const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        // 1. Find or create the 'learnaxia' user
        let owner = await prisma.user.findUnique({ where: { handle: 'learnaxia' } });

        if (!owner) {
            console.log("'learnaxia' user not found. Creating...");
            // Check if email exists
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

        console.log("Owner ID:", owner.id);

        // 2. Create a test Module
        const testModule = await prisma.module.create({
            data: {
                title: 'İleri Seviye React Test Modülü',
                description: 'Bu modül UI testleri için Learnaxia tarafından otomatik oluşturulmuştur. Harika tasarım değişikliklerini test etmek için harika bir fırsat.',
                type: 'FLASHCARD',
                status: 'PUBLISHED',
                visibility: 'PUBLIC',
                isVerified: true,
                ownerId: owner.id,
                creatorId: owner.id,
                category: 'Yazılım',
                subCategory: 'React'
            }
        });
        console.log("Created Module:", testModule.id);

        // Add some dummy items to the module to make metrics look realistic
        await prisma.item.createMany({
            data: [
                { moduleId: testModule.id, type: 'FLASHCARD', order: 1, contentHash: 'hash1', content: { front: 'A', back: 'B' } },
                { moduleId: testModule.id, type: 'FLASHCARD', order: 2, contentHash: 'hash2', content: { front: 'C', back: 'D' } },
                { moduleId: testModule.id, type: 'FLASHCARD', order: 3, contentHash: 'hash3', content: { front: 'E', back: 'F' } },
            ]
        });

        // 3. Create a test Collection
        const testCollection = await prisma.collection.create({
            data: {
                title: 'Frontend Mastery 2026',
                description: 'Mükemmel arayüzler tasarlamak ve geliştirmek için ihtiyacınız olan her şey. UI/UX prensiplerinden modern frameworklere kadar...',
                visibility: 'PUBLIC',
                isVerified: true,
                ownerId: owner.id,
                category: 'Tasarım ve Yazılım',
                subCategory: 'Frontend'
            }
        });
        console.log("Created Collection:", testCollection.id);

        // Link module to collection
        await prisma.collectionItem.create({
            data: {
                collectionId: testCollection.id,
                moduleId: testModule.id,
                order: 1
            }
        });

        // 4. Create a test Note
        const testNote = await prisma.note.create({
            data: {
                userId: owner.id,
                title: 'LibraryCard Refactoring Notları',
                content: 'Bugün LibraryCard tasarımını yeniledik. \n\nGlassmorphism ve soft shadow teknikleri kullanarak premium bir his oluşturmaya odaklandık. Ayrıca own-content engellemelerini ekliyoruz.',
            }
        });
        console.log("Created Note:", testNote.id);

        console.log("Seeding completed successfully!");

    } catch (error) {
        console.error("Error during seeding:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
