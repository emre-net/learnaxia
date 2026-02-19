
import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

function computeHash(content: any): string {
    const normalized = JSON.stringify(content, Object.keys(content).sort());
    return createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

async function main() {
    console.log("🌱 STARTING SEED...");

    // 1. Find User
    const targetHandle = "netemre387";
    let user = await prisma.user.findFirst({
        where: { handle: targetHandle }
    });

    if (!user) {
        console.log(`User @${targetHandle} not found. Creating...`);
        user = await prisma.user.create({
            data: {
                email: "emre_test@example.com",
                name: "Emre Test",
                handle: targetHandle
            }
        } as any);
    }
    console.log(`👤 Using User: ${user.email} (${user.id})`);

    // 2. Define Module Data
    const modules: any[] = [
        {
            title: "DEMO: Flashcards",
            description: "Basic flashcards for testing flip animations.",
            type: "FLASHCARD",
            items: [
                { type: "FLASHCARD", content: { front: "Apple", back: "Elma" } },
                { type: "FLASHCARD", content: { front: "Book", back: "Kitap" } },
                { type: "FLASHCARD", content: { front: "Computer", back: "Bilgisayar" } },
                { type: "FLASHCARD", content: { front: "Sun", back: "Güneş" } },
                { type: "FLASHCARD", content: { front: "Moon", back: "Ay" } }
            ]
        },
        {
            title: "DEMO: Multiple Choice",
            description: "Quiz mode with 4 options.",
            type: "MC", // Testing normalization
            items: [
                {
                    type: "MULTIPLE_CHOICE", // Testing normalization logic in Service
                    content: {
                        question: "Türkiye'nin başkenti neresidir?",
                        options: ["İstanbul", "Ankara", "İzmir", "Bursa"],
                        answer: "Ankara",
                        explanation: "1923'ten beri başkenttir."
                    }
                },
                {
                    type: "MC",
                    content: {
                        question: "Hangi gezegen Kızıl Gezegen olarak bilinir?",
                        options: ["Venüs", "Mars", "Jüpiter", "Satürn"],
                        answer: "Mars",
                        explanation: "Yüzeyindeki demir oksitten dolayı kızıldır."
                    }
                },
                {
                    type: "MC",
                    content: {
                        question: "Su kaç derecede kaynar?",
                        options: ["90", "100", "110", "120"],
                        answer: "100",
                        explanation: "Deniz seviyesinde 100°C."
                    }
                }
            ]
        },
        {
            title: "DEMO: True / False",
            description: "True/False Statements mapped to Quiz.",
            type: "TRUE_FALSE",
            items: [
                {
                    type: "TF", // Testing TF normalization
                    content: {
                        statement: "Dünya düzdür.",
                        answer: "False",
                        explanation: "Dünya geoit şeklindedir."
                    }
                },
                {
                    type: "TRUE_FALSE",
                    content: {
                        statement: "Işık sesten daha hızlıdır.",
                        answer: "True",
                        explanation: "Işık hızı 300,000 km/s iken ses hızı 340 m/s'dir."
                    }
                },
                {
                    type: "TF",
                    content: {
                        statement: "İnsan vücudundaki en büyük organ deridir.",
                        answer: "True",
                        explanation: "Yetişkinlerde yaklaşık 2m² alan kaplar."
                    }
                }
            ]
        },
        {
            title: "DEMO: Gap Fill",
            description: "Fill in the blanks.",
            type: "GAP",
            items: [
                {
                    type: "GAP",
                    content: {
                        text: "Türkiye'nin en kalabalık şehri {{İstanbul}}'dur.",
                        answers: ["İstanbul"]
                    }
                },
                {
                    type: "GAP_FILL", // Testing normalization
                    content: {
                        text: "Su {{hidrojen}} ve {{oksijen}} atomlarından oluşur.",
                        answers: ["hidrojen", "oksijen"]
                    }
                }
            ]
        }
    ];

    // 3. Create Modules
    for (const mod of modules) {
        console.log(`creating module: ${mod.title}...`);

        // Transaction to ensure module + library entry + access
        await prisma.$transaction(async (tx) => {
            const createdModule = await tx.module.create({
                data: {
                    title: mod.title,
                    description: mod.description,
                    type: mod.type === 'TRUE_FALSE' ? 'FLASHCARD' : (mod.type === 'GAP' ? 'GAP' : (mod.type === 'MC' ? 'MC' : 'FLASHCARD')), // Fallback for DB enum constraint if strict
                    // Actually Schema defines type as String, so pass raw is protected.
                    // But usually creating generic type for container is safer.
                    // Let's use the intended type string directly since it is String in schema.
                    // type: mod.type,
                    status: 'ACTIVE',
                    ownerId: user.id,
                    creatorId: user.id,
                    isForkable: true
                }
            });

            // Create Items
            if (mod.items.length > 0) {
                await tx.item.createMany({
                    data: mod.items.map((item: any, index: number) => ({
                        moduleId: createdModule.id,
                        type: item.type,
                        content: item.content,
                        contentHash: computeHash(item.content),
                        order: index
                    }))
                });
            }

            // Grant Access
            await tx.userContentAccess.create({
                data: {
                    userId: user.id,
                    resourceId: createdModule.id,
                    resourceType: 'MODULE',
                    accessLevel: 'OWNER'
                }
            });

            // Add to Library
            await tx.userModuleLibrary.create({
                data: {
                    userId: user.id,
                    moduleId: createdModule.id,
                    role: 'OWNER',
                    lastInteractionAt: new Date()
                }
            });
        });
    }

    console.log("✅ SEED COMPLETE!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
