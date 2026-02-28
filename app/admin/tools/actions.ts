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
            prisma.module.updateMany({ data: { sourceModuleId: null } }),
            prisma.module.deleteMany({}),

            // 6. Miscellanous
            prisma.pDFAsset.deleteMany({}),
            prisma.weaknessReport.deleteMany({}),
            prisma.systemLog.deleteMany({}),
        ]);

        revalidatePath("/admin");
        return { success: true, message: "Kullanıcılar hariç tüm içerik veritabanları (Modül, Not, Koleksiyon) başarıyla sıfırlandı." };
    } catch (error: any) {
        console.error("Reset error:", error);

        try {
            await prisma.systemLog.create({
                data: {
                    level: 'ERROR',
                    environment: process.env.NODE_ENV || 'development',
                    service: 'admin/cleanup',
                    source: 'SERVER',
                    message: `Veritabanı sıfırlama hatası (resetContentAction): ${error.message || String(error)}`,
                    stack: error.stack
                }
            });
        } catch (logError) {
            console.error("Failed to write to systemLog:", logError);
        }

        return { success: false, message: "Sıfırlarken hata oluştu. Lütfen detaylar için Admin Log sekmesini kontrol edin." };
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

        const modulesData = [
            { title: 'Modern React Mimarileri', desc: 'React 19, Server Components, ve daha fazlası.', cat: 'Yazılım', subcat: 'React' },
            { title: 'Gelişmiş TypeScript', desc: 'Jenerikler, Tipe Güvenli Tasarımlar ve İleri Seviye Konseptler', cat: 'Yazılım', subcat: 'TypeScript' },
            { title: 'UI/UX Temel İlkeleri', desc: 'Etkili ve kullanıcı dostu arayüzler tasarlamak.', cat: 'Tasarım', subcat: 'UI/UX' },
            { title: 'PostgreSQL Optimizasyonu', desc: 'Büyük verilerle çalışırken veritabanı performansı.', cat: 'Yazılım', subcat: 'Veritabanı' },
            { title: 'Next.js App Router', desc: 'Layoutlar, loading state\'leri ve veri çekme yöntemleri', cat: 'Yazılım', subcat: 'Next.js' },
            { title: 'Figma ile Prototipleme', desc: 'Tasarımı canlandırma ve etkileşim ekleme süreçleri.', cat: 'Tasarım', subcat: 'Figma' }
        ];

        const createdModules = [];
        for (const data of modulesData) {
            const m = await prisma.module.create({
                data: {
                    title: data.title,
                    description: data.desc,
                    type: 'FLASHCARD',
                    status: 'ACTIVE',
                    visibility: 'PUBLIC',
                    isVerified: true,
                    ownerId: owner.id,
                    creatorId: owner.id,
                    category: data.cat,
                    subCategory: data.subcat,
                    items: {
                        create: [
                            { type: 'FLASHCARD', order: 1, contentHash: `hash-${data.title}-1`, content: { front: 'Soru 1', back: 'Cevap 1' } },
                            { type: 'FLASHCARD', order: 2, contentHash: `hash-${data.title}-2`, content: { front: 'Soru 2', back: 'Cevap 2' } },
                        ]
                    }
                }
            });
            createdModules.push(m);

            await prisma.userModuleLibrary.upsert({
                where: { userId_moduleId: { userId: owner.id, moduleId: m.id } },
                update: {},
                create: { userId: owner.id, moduleId: m.id, role: 'OWNER' }
            });
        }

        const collectionsData = [
            { title: 'Frontend Mastery 2026', desc: 'Mükemmel arayüzler tasarlamak ve geliştirmek için ihtiyacınız olan her şey.', cat: 'Yazılım', subcat: 'Frontend' },
            { title: 'Backend Geliştirme Paketi', desc: 'Sunucu tarafı teknolojiler ve veritabanı yönetimi.', cat: 'Yazılım', subcat: 'Backend' },
            { title: 'Fullstack Yol Haritası', desc: 'Uçtan uca web uygulamaları geliştirme rehberi.', cat: 'Yazılım', subcat: 'Fullstack' },
            { title: 'Tasarımcılar Kod Yazıyor', desc: 'Tasarımcılar için kodlama temelleri.', cat: 'Tasarım', subcat: 'UI/UX' },
            { title: 'Gelişmiş Web Performansı', desc: 'Web sitelerini saniyenin altında yükleme hedefleri.', cat: 'Yazılım', subcat: 'Performans' },
        ];

        for (const [idx, data] of collectionsData.entries()) {
            const moduleX = createdModules[idx % createdModules.length];
            const moduleY = createdModules[(idx + 1) % createdModules.length];

            const c = await prisma.collection.create({
                data: {
                    title: data.title,
                    description: data.desc,
                    visibility: 'PUBLIC',
                    isVerified: true,
                    ownerId: owner.id,
                    category: data.cat,
                    subCategory: data.subcat,
                    items: {
                        create: [
                            { moduleId: moduleX.id, order: 1 },
                            { moduleId: moduleY.id, order: 2 }
                        ]
                    }
                }
            });

            await prisma.userCollectionLibrary.upsert({
                where: { userId_collectionId: { userId: owner.id, collectionId: c.id } },
                update: {},
                create: { userId: owner.id, collectionId: c.id, role: 'OWNER' }
            });
        }

        await prisma.note.createMany({
            data: [
                { userId: owner.id, title: 'LibraryCard Refactoring Notları', content: 'Bugün LibraryCard tasarımını yeniledik. \n\nGlassmorphism ve soft shadow teknikleri kullanarak premium bir his oluşturmaya odaklandık. Ayrıca own-content engellemelerini ekliyoruz', visibility: 'PUBLIC' },
                { userId: owner.id, title: 'Veritabanı Optimizasyonları', content: 'PostgreSQL indexing kullanarak query sürelerini 2ms seviyesine indirdik. Ayrıca Prisma sorgularını birleştirerek 15 farklı network requesti tek transaction içinde hallettik.', visibility: 'PUBLIC' },
                { userId: owner.id, title: 'Sonraki Versiyon V2.0 Hedefleri', content: 'Önümüzdeki aylarda yapay zeka entegreli akıllı tekrarlama algoritmamızı test gruplarına açacağız.', visibility: 'PUBLIC' }
            ]
        });

        revalidatePath("/admin");
        return { success: true, message: "Test verileri (Modül, Koleksiyon, Not) başarıyla oluşturuldu." };

    } catch (error) {
        console.error("Seed test data error:", error);
        return { success: false, message: "Test verisi üretirken bir hata oluştu." };
    }
}
