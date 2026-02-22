
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

function generateHash(content) {
    return crypto.createHash('md5').update(JSON.stringify(content)).digest('hex');
}

async function seed() {
    try {
        console.log("Seeding Learnaxia content...");

        // 1. Create Learnaxia Admin User
        let learnaxiaUser = await prisma.user.findUnique({ where: { handle: 'learnaxia' } });
        if (!learnaxiaUser) {
            learnaxiaUser = await prisma.user.create({
                data: {
                    name: 'Learnaxia Official',
                    email: 'info@learnaxia.com',
                    handle: 'learnaxia',
                    role: 'ADMIN',
                    language: 'tr',
                    status: 'ACTIVE'
                }
            });
            console.log("User 'learnaxia' created.");
        }

        const ownerId = learnaxiaUser.id;

        const modulesData = [
            {
                title: "Almanca A1 - Temel Kelimeler",
                description: "Yeni başlayanlar için en sık kullanılan Almanca kelimeler ve selamlaşma kalıpları.",
                type: "FLASHCARD",
                category: "Dil Öğrenimi",
                subCategory: "Almanca",
                items: [
                    { content: { front: "Guten Tag", back: "İyi Günler" }, order: 1 },
                    { content: { front: "Wasser", back: "Su" }, order: 2 },
                    { content: { front: "Brot", back: "Ekmek" }, order: 3 },
                    { content: { front: "Bitte", back: "Lütfen" }, order: 4 },
                    { content: { front: "Danke", back: "Teşekkürler" }, order: 5 }
                ]
            },
            {
                title: "JavaScript - Modern ES6+ Özellikleri",
                description: "Arrow functions, destructuring ve template literals gibi modern JS temelleri.",
                type: "MULTIPLE_CHOICE",
                category: "Yazılım",
                subCategory: "Web Geliştirme",
                items: [
                    {
                        content: {
                            question: "Hangi anahtar kelime blok kapsamlı (block-scoped) değişken tanımlamak için kullanılır?",
                            options: ["var", "let", "global", "def"],
                            correctAnswer: "let"
                        },
                        order: 1
                    },
                    {
                        content: {
                            question: "Arrow function hangisidir?",
                            options: ["function() {}", "() => {}", "def function:", "lambda x:"],
                            correctAnswer: "() => {}"
                        },
                        order: 2
                    }
                ]
            },
            {
                title: "Biyoloji - Hücrenin Yapısı",
                description: "Organeller, hücre zarı ve enerji üretimi hakkında temel bilgiler.",
                type: "MULTIPLE_CHOICE",
                category: "Bilim",
                subCategory: "Biyoloji",
                items: [
                    {
                        content: {
                            question: "Hücrenin enerji santrali hangi organeldir?",
                            options: ["Ribozom", "Mitokondri", "Lizozom", "Golgi"],
                            correctAnswer: "Mitokondri"
                        },
                        order: 1
                    }
                ]
            },
            {
                title: "İngilizce Deyimler",
                description: "Günlük hayatta sık karşılaşabileceğiniz İngilizce deyimler.",
                type: "FLASHCARD",
                category: "Dil Öğrenimi",
                subCategory: "İngilizce",
                items: [
                    { content: { front: "Piece of cake", back: "Çok kolay (çocuk oyuncağı)" }, order: 1 },
                    { content: { front: "Under the weather", back: "Biraz halsiz/hasta" }, order: 2 }
                ]
            },
            {
                title: "Türk Tarihi - Kurtuluş Savaşı Kronolojisi",
                description: "Milli Mücadele dönemindeki dönüm noktaları ve antlaşmalar.",
                type: "GAP_FILL",
                category: "Tarih",
                subCategory: "Türkiye Tarihi",
                items: [
                    {
                        content: {
                            text: "Mustafa Kemal Atatürk, 19 Mayis'ta {1} şehrine çıkarak Milli Mücadele'yi başlatmıştır.",
                            blanks: { "1": "Samsun" }
                        },
                        order: 1
                    },
                    {
                        content: {
                            text: "29 Ekim 1923 tarihinde {1} ilan edilmiştir.",
                            blanks: { "1": "Cumhuriyet" }
                        },
                        order: 2
                    }
                ]
            },
            {
                title: "Dünya Coğrafyası - Başkentler",
                description: "Ülkeler ve başkentleri hakkında temel genel kültür bilgileri.",
                type: "TRUE_FALSE",
                category: "Coğrafya",
                items: [
                    { content: { question: "Fransa'nın başkenti Lyon'dur.", isTrue: false }, order: 1 },
                    { content: { question: "Japonya'nın başkenti Tokyo'dur.", isTrue: true }, order: 2 }
                ]
            },
            {
                title: "Astronomi - Güneş Sistemi",
                description: "Gezegenler ve özellikleri hakkında flashcard seti.",
                type: "FLASHCARD",
                category: "Bilim",
                subCategory: "Astronomi",
                items: [
                    { content: { front: "En büyük gezegen", back: "Jüpiter" }, order: 1 },
                    { content: { front: "Halkalı gezegen", back: "Satürn" }, order: 2 }
                ]
            },
            {
                title: "Edebiyat - Türk Klasikleri",
                description: "Önemli eserler ve yazarları.",
                type: "GAP_FILL",
                category: "Edebiyat",
                items: [
                    { content: { text: "Araba Sevdası, {1} tarafından yazılmıştır.", blanks: { "1": "Recaizade Mahmut Ekrem" } }, order: 1 },
                    { content: { text: "Mai ve Siyah'ın yazarı {1}'dir.", blanks: { "1": "Halit Ziya Uşaklıgil" } }, order: 2 }
                ]
            },
            {
                title: "Psikoloji - Temel Kavramlar",
                description: "Psikolojinin temel terimleri üzerine bir test.",
                type: "TRUE_FALSE",
                category: "Sosyal Bilimler",
                subCategory: "Psikoloji",
                items: [
                    { content: { question: "Freud, psikanalizin kurucusudur.", isTrue: true }, order: 1 },
                    { content: { question: "Empati, başkasının duygularını anlamaktır.", isTrue: true }, order: 2 }
                ]
            },
            {
                title: "Kimya - Periyodik Tablo",
                description: "Elementler ve sembolleri.",
                type: "MULTIPLE_CHOICE",
                category: "Bilim",
                subCategory: "Kimya",
                items: [
                    { content: { question: "Altın'ın simgesi nedir?", options: ["Ag", "Au", "Fe", "Cu"], correctAnswer: "Au" }, order: 1 },
                    { content: { question: "H hangi elementi temsil eder?", options: ["Helyum", "Hidrojen", "Hafniyum", "Holmiyum"], correctAnswer: "Hidrojen" }, order: 2 }
                ]
            },
            {
                title: "Matematik - Temel Formüller",
                description: "Geometri ve cebir formülleri.",
                type: "FLASHCARD",
                category: "Matematik",
                items: [
                    { content: { front: "Dairenin Alanı", back: "πr²" }, order: 1 },
                    { content: { front: "Pisagor Teoremi", back: "a² + b² = c²" }, order: 2 }
                ]
            },
            {
                title: "Sanat - Ünlü Tablolar",
                description: "Dünya sanat tarihinin ikonik eserleri.",
                type: "FLASHCARD",
                category: "Sanat",
                items: [
                    { content: { front: "Mona Lisa", back: "Leonardo da Vinci" }, order: 1 },
                    { content: { front: "Yıldızlı Gece", back: "Vincent van Gogh" }, order: 2 }
                ]
            }
        ];

        for (const mData of modulesData) {
            const existing = await prisma.module.findFirst({ where: { title: mData.title, ownerId: ownerId } });
            if (existing) {
                console.log(`Skipping existing module: ${mData.title}`);
                continue;
            }

            const mod = await prisma.module.create({
                data: {
                    title: mData.title,
                    description: mData.description,
                    type: mData.type,
                    category: mData.category,
                    subCategory: mData.subCategory,
                    status: 'ACTIVE',
                    isVerified: true,
                    isForkable: true,
                    ownerId: ownerId,
                    creatorId: ownerId,
                    items: {
                        create: mData.items.map(i => ({
                            type: mData.type,
                            content: i.content,
                            contentHash: generateHash(i.content),
                            order: i.order
                        }))
                    }
                }
            });
            console.log(`Created module: ${mod.title}`);
        }

        console.log("Seeding completed successfully.");

    } catch (e) {
        console.error("SEED ERROR:", e);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
