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
                isPublic: true,
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
