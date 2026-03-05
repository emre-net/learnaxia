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
            {
                title: 'Modern React Mimarileri 2026',
                desc: 'React 19, Server Components, ve daha fazlası. Bu modül güncel UI geliştirme süreçlerini kapsar.',
                cat: 'Yazılım',
                subcat: 'React',
                items: [
                    { type: 'FLASHCARD', order: 1, contentHash: `hash-r19-1`, content: { front: 'React 19 ile gelen useActionState hook\'unun avantajı nedir?', back: 'Server actionların yüklenme (pending) ve sonuç durumlarını kolayca yönetmeyi sağlar.' } },
                    { type: 'MULTIPLE_CHOICE', order: 2, contentHash: `hash-r19-2`, content: { question: 'Hangisi React Server Components (RSC) kurallarından biridir?', options: ['useState hookunu kullanabilirler', 'onClick eventi eklenebilir', 'Sadece backend üzerinde render edilirler', 'Browser APIlerine doğrudan erişebilirler'], correctAnswer: 'Sadece backend üzerinde render edilirler', explanation: 'RSC\'ler server tarafında render edilir. Client-side interaktivite kullanılamaz.' } },
                    { type: 'FLASHCARD', order: 3, contentHash: `hash-r19-3`, content: { front: 'React compilerın (React Forget) temel amacı nedir?', back: 'Manuel useMemo ve useCallback kullanımını ortadan kaldırarak performansı otomatik optimize etmek.' } },
                ]
            },
            {
                title: 'Gelişmiş TypeScript',
                desc: 'Jenerikler, Tipe Güvenli Tasarımlar ve İleri Seviye Konseptler üzerine yoğunlaşmış profesyonel modül.',
                cat: 'Yazılım',
                subcat: 'TypeScript',
                items: [
                    { type: 'FLASHCARD', order: 1, contentHash: `hash-ts-1`, content: { front: 'Utility Tip: Omit<T, K> ne yapar?', back: 'Verilen bir tipten (T), belirtilen anahtarları (K) çıkartarak yeni bir tip oluşturur.' } },
                    { type: 'MULTIPLE_CHOICE', order: 2, contentHash: `hash-ts-2`, content: { question: 'TypeScript\'te never type\'ı ne anlama gelir?', options: ['Herhangi bir değer alabilir', 'Hiç gerçekleşmeyecek olan dönüş değerini temsil eder', 'Bilinmeyen tipler içindir', 'Sadece undefined olabilir'], correctAnswer: 'Hiç gerçekleşmeyecek olan dönüş değerini temsil eder', explanation: 'Örneğin her zaman hata fırlatan veya sonsuz döngüye giren fonksiyonların dönüş tipidir.' } },
                ]
            },
            {
                title: 'Sistem Tasarımı (System Design)',
                desc: 'Web uygulamalarının ölçeklendirilmesi, mikroservis mimarileri ve veritabanı performans teknikleri.',
                cat: 'Yazılım',
                subcat: 'Mimari',
                items: [
                    { type: 'FLASHCARD', order: 1, contentHash: `hash-sd-1`, content: { front: 'CAP Teoremi nedir?', back: 'Dağıtık sistemlerde Consistency (Tutarlılık), Availability (Erişilebilirlik) ve Partition tolerance (Bölünme toleransı) özelliklerinden aynı anda en fazla ikisinin garanti edilebileceğidir.' } },
                    { type: 'MULTIPLE_CHOICE', order: 2, contentHash: `hash-sd-2`, content: { question: 'Hangi load balancing algoritması sunucuların kapasitelerine göre iş dağılımı yapar?', options: ['Round Robin', 'Least Connections', 'Weighted Round Robin', 'IP Hash'], correctAnswer: 'Weighted Round Robin', explanation: 'Farklı donanım özelliklerine sahip sunuculara ağırlık (weight) atanarak dağıtım yapılır.' } },
                    { type: 'FLASHCARD', order: 3, contentHash: `hash-sd-3`, content: { front: 'Redis gibi InMemory veritabanlarının temel kullanım alanı nedir?', back: 'Sık erişilen verilerin (Session, Cache, vs) çok yüksek hızda RAM üzerinde önbelleklenmesidir.' } },
                ]
            }
        ];

        const createdModules = [];
        for (const data of modulesData) {
            const m = await prisma.module.create({
                data: {
                    title: data.title,
                    description: data.desc,
                    type: 'MIXED',
                    status: 'ACTIVE',
                    visibility: 'PUBLIC',
                    isVerified: true,
                    ownerId: owner.id,
                    creatorId: owner.id,
                    category: data.cat,
                    subCategory: data.subcat,
                    items: {
                        create: data.items.map(item => ({
                            type: item.type as any,
                            order: item.order,
                            contentHash: item.contentHash,
                            content: item.content
                        }))
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
            { title: 'Fullstack Mimarisi Masterclass', desc: 'Modern web uygulamaları geliştirmek için React, TypeScript ve Sistem Tasarımı konularının harmanlandığı set.', cat: 'Yazılım', subcat: 'Fullstack' },
            { title: 'Frontend Senior Hazırlık', desc: 'Sadece UI çizmek değil, mimari ve optimizasyon konularına odaklanan ileri seviye liste.', cat: 'Yazılım', subcat: 'Frontend' }
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
                { userId: owner.id, title: 'LibraryCard Refactoring Süreç Raporu', content: '<h2>Tasarım Değişiklikleri</h2><p>Bugün LibraryCard tasarımını yeniledik. Glassmorphism kaldırıldı, daha sade ve okunaklı bir tasarım (soft shadow, clean borders) entegre edildi.</p><ul><li>Borders temizlendi</li><li>E2E Testler tamamlandı</li></ul>', visibility: 'PUBLIC' },
                { userId: owner.id, title: 'Veritabanı Optimizasyonları (PostgreSQL)', content: '<h3>Performans Hedefi</h3><p>Veritabanı optimizasyonlarıyla query performansını artırıyoruz.</p><blockquote>Prisma sorguları tek transactionda olacak şekilde birleştirilebilir.</blockquote>', visibility: 'PUBLIC' },
                { userId: owner.id, title: 'Sistem Hedefleri ve Yeni Modüller', content: '<strong>Güçlü Bir Sistem Platformu</strong> içerisinde planlanan test özellikleri ve yeni UI geliştirmeleri tamamlandı. Geriye kalan detaylar kullanıcı geri bildirimleriyle şekillenecek.', visibility: 'PUBLIC' }
            ]
        });

        revalidatePath("/admin");
        return { success: true, message: "Yeni yapıya %100 uyumlu güncel test verileri (Modül, Koleksiyon, Not) başarıyla oluşturuldu." };

    } catch (error: any) {
        console.error("Seed test data error:", error);
        return { success: false, message: `Test verisi üretirken hata oluştu: ${error?.message}` };
    }
}
