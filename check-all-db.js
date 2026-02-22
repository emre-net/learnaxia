
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAll() {
    try {
        const counts = {
            users: await prisma.user.count(),
            modules: await prisma.module.count(),
            collections: await prisma.collection.count(),
            items: await prisma.item.count(),
            solvedQuestions: await prisma.solvedQuestion.count(),
            userModuleLibrary: await prisma.userModuleLibrary.count(),
            userCollectionLibrary: await prisma.userCollectionLibrary.count()
        };
        console.log("DATABASE STATUS REPORT:");
        console.log(JSON.stringify(counts, null, 2));

        if (counts.modules > 0) {
            const sampleModules = await prisma.module.findMany({
                take: 3,
                select: { id: true, title: true, status: true, ownerId: true }
            });
            console.log("SAMPLE MODULES:", JSON.stringify(sampleModules, null, 2));
        }
    } catch (e) {
        console.error("DB CHECK ERROR:", e);
    } finally {
        await prisma.$disconnect();
    }
}

checkAll();
