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
 * Seed Learnaxia Corporate Content
 */
export async function seedLearnaxiaContentAction() {
    await ensureAdmin();

    try {
        // 1. Create/Find Learnaxia User
        const learnaxiaUser = await prisma.user.upsert({
            where: { email: "foundation@learnaxia.com" },
            update: { handle: "learnaxia", role: "ADMIN", status: "ACTIVE" },
            create: {
                email: "foundation@learnaxia.com",
                handle: "learnaxia",
                role: "ADMIN",
                status: "ACTIVE",
                language: "tr"
            }
        });

        const userId = learnaxiaUser.id;

        // 2. Define 8 Modules
        const modules = [
            {
                title: "İngilizce: Günlük Konuşma Kalıpları",
                description: "En çok kullanılan 20 temel İngilizce kalıp.",
                type: "FLASHCARD",
                category: "Languge",
                items: [
                    { content: { front: "Nice to meet you", back: "Tanıştığımıza memnun oldum" } },
                    { content: { front: "How is it going?", back: "Nasıl gidiyor?" } },
                    { content: { front: "Could you help me?", back: "Bana yardım edebilir misiniz?" } }
                ]
            },
            {
                title: "JavaScript Temelleri: Değişkenler",
                description: "JS'de let, const ve var kullanımı üzerine test.",
                type: "MC",
                category: "Technology",
                items: [
                    { content: { question: "Hangi anahtar kelime sonradan değiştirilemeyen bir değişken tanımlar?", options: ["let", "var", "const", "def"], answer: "const" } },
                    { content: { question: "Modern JavaScript'te hangisinin kullanımı önerilmez?", options: ["let", "const", "var", "class"], answer: "var" } }
                ]
            },
            {
                title: "Dünya Coğrafyası: Başkentler",
                description: "Zorlayıcı bir başkent testi.",
                type: "GAP",
                category: "General Culture",
                items: [
                    { content: { text: "Fransa'nın başkenti ____'dir.", answer: "Paris" } },
                    { content: { text: "Japonya'nın başkenti ____'dur.", answer: "Tokyo" } }
                ]
            },
            {
                title: "Biyoloji: Hücre Organelleri",
                description: "Hücre organelleri ve görevleri hakkında doğru/yanlış testi.",
                type: "TRUE_FALSE",
                category: "Science",
                items: [
                    { content: { statement: "Mitokondri hücrenin enerji merkezidir.", answer: true } },
                    { content: { statement: "Ribozomlar sadece bitki hücrelerinde bulunur.", answer: false } }
                ]
            },
            {
                title: "Girişimcilik 101: Temel Kavramlar",
                description: "Girişimcilik dünyasına adım atın.",
                type: "FLASHCARD",
                category: "Business",
                items: [
                    { content: { front: "MVP nedir?", back: "Minimum Viable Product (Minimum Uygulanabilir Ürün)" } },
                    { content: { front: "Unicorn Girişim", back: "Değeri 1 milyar doları aşan girişim" } }
                ]
            },
            {
                title: "Yedinci Sanat: Film Kültürü",
                description: "Sinema tarihi hakkında çoktan seçmeli sorular.",
                type: "MC",
                category: "Arts",
                items: [
                    { content: { question: "Tarihteki ilk sesli film hangisidir?", options: ["The Jazz Singer", "Citizen Kane", "Metropolis", "Psycho"], answer: "The Jazz Singer" } }
                ]
            },
            {
                title: "Osmanlı Tarihi: Yükselme Dönemi",
                description: "Yükselme dönemi padişahları ve olayları.",
                type: "GAP",
                category: "History",
                items: [
                    { content: { text: "İstanbul'u ____ yılında Fatih Sultan Mehmet fethetmiştir.", answer: "1453" } }
                ]
            },
            {
                title: "Kişisel Gelişim: Zaman Yönetimi",
                description: "Daha verimli çalışmak için temel stratejiler.",
                type: "TRUE_FALSE",
                category: "Personal Development",
                items: [
                    { content: { statement: "Pomodoro tekniği 25 dakika çalışma ve 5 dakika mola esasına dayanır.", answer: true } }
                ]
            }
        ];

        // 3. Create Modules & Collection
        const createdModuleIds: string[] = [];

        for (const m of modules) {
            const module = await prisma.module.create({
                data: {
                    title: m.title,
                    description: m.description,
                    type: m.type,
                    status: 'ACTIVE',
                    isVerified: true,
                    ownerId: userId,
                    creatorId: userId,
                    category: m.category,
                    items: {
                        create: m.items.map((item, index) => ({
                            type: m.type,
                            content: item.content as any,
                            contentHash: Math.random().toString(36).substring(7), // Quick hash for seed
                            order: index
                        }))
                    }
                }
            });

            // Add to library for clarity
            await prisma.userModuleLibrary.create({
                data: { userId, moduleId: module.id, role: 'OWNER' }
            });
            await prisma.userContentAccess.create({
                data: { userId, resourceId: module.id, resourceType: 'MODULE', accessLevel: 'OWNER' }
            });

            createdModuleIds.push(module.id);
        }

        // 4. Create Collection
        const collection = await prisma.collection.create({
            data: {
                title: "Learnaxia Akademi: Başlangıç Paketi",
                description: "Uygulamamızı tanımanız için hazırladığımız özel içerikler.",
                visibility: 'PUBLIC',
                isVerified: true,
                ownerId: userId,
                items: {
                    create: createdModuleIds.map((mid, idx) => ({
                        moduleId: mid,
                        order: idx
                    }))
                }
            }
        });

        // Add collection to library
        await prisma.userCollectionLibrary.create({
            data: { userId, collectionId: collection.id, role: 'OWNER' }
        });

        revalidatePath("/admin");
        return { success: true, message: "Learnaxia kurumsal içerikleri başarıyla oluşturuldu." };

    } catch (error) {
        console.error("Seed error:", error);
        return { success: false, message: "Seed işlemi başarısız." };
    }
}

/**
 * Dangerous: Resets only modules and study-related data, keeping users.
 */
export async function resetContentAction() {
    await ensureAdmin();

    try {
        await prisma.$transaction([
            // 1. Delete Interactions and Progress
            prisma.itemSession.deleteMany({}),
            prisma.learningSession.deleteMany({}),
            prisma.sM2Progress.deleteMany({}),
            prisma.itemProgress.deleteMany({}),
            prisma.userQuestionOverride.deleteMany({}),

            // 2. Delete Libraries & Access
            prisma.userModuleLibrary.deleteMany({}),
            prisma.userCollectionLibrary.deleteMany({}),
            prisma.userContentAccess.deleteMany({}),

            // 3. Delete Notes & Solved Questions
            prisma.note.deleteMany({}),
            prisma.solvedQuestion.deleteMany({}),

            // 4. Delete Exams & Attempts
            prisma.examAttempt.deleteMany({}),
            prisma.exam.deleteMany({}),

            // 5. Delete Core Structure (Items, Modules, Collections)
            prisma.collectionItem.deleteMany({}),
            prisma.item.deleteMany({}),
            prisma.collection.deleteMany({}),
            prisma.module.deleteMany({}),

            // 6. Miscellanous
            prisma.pDFAsset.deleteMany({}),
            prisma.weaknessReport.deleteMany({}),
            prisma.systemLog.deleteMany({}),
        ]);

        revalidatePath("/admin");
        return { success: true, message: "Kullanıcılar hariç tüm içerik veritabanları (Modül, Not, Koleksiyon) başarıyla sıfırlandı." };
    } catch (error) {
        console.error("Reset error:", error);
        return { success: false, message: "Sıfırlarken hata oluştu." };
    }
}

export async function seedTestDataAction() {
    await ensureAdmin();

    try {
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

        await prisma.item.createMany({
            data: [
                { moduleId: testModule.id, type: 'FLASHCARD', order: 1, contentHash: 'hash1', content: { front: 'A', back: 'B' } },
                { moduleId: testModule.id, type: 'FLASHCARD', order: 2, contentHash: 'hash2', content: { front: 'C', back: 'D' } },
                { moduleId: testModule.id, type: 'FLASHCARD', order: 3, contentHash: 'hash3', content: { front: 'E', back: 'F' } },
            ]
        });

        await prisma.userModuleLibrary.upsert({
            where: { userId_moduleId: { userId: owner.id, moduleId: testModule.id } },
            update: {},
            create: { userId: owner.id, moduleId: testModule.id, role: 'OWNER' }
        });

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

        await prisma.collectionItem.create({
            data: { collectionId: testCollection.id, moduleId: testModule.id, order: 1 }
        });

        await prisma.userCollectionLibrary.upsert({
            where: { userId_collectionId: { userId: owner.id, collectionId: testCollection.id } },
            update: {},
            create: { userId: owner.id, collectionId: testCollection.id, role: 'OWNER' }
        });

        await prisma.note.create({
            data: {
                userId: owner.id,
                title: 'LibraryCard Refactoring Notları',
                content: 'Bugün LibraryCard tasarımını yeniledik. \n\nGlassmorphism ve soft shadow teknikleri kullanarak premium bir his oluşturmaya odaklandık. Ayrıca own-content engellemelerini ekliyoruz',
            }
        });

        revalidatePath("/admin");
        return { success: true, message: "Test verileri (Modül, Koleksiyon, Not) başarıyla oluşturuldu." };

    } catch (error) {
        console.error("Seed test data error:", error);
        return { success: false, message: "Test verisi üretirken bir hata oluştu." };
    }
}
