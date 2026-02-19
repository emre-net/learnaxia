const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting database cleanup...");

    // 1. Delete Item Sessions (Dependent on LearningSession & Item)
    const itemSessions = await prisma.itemSession.deleteMany({});
    console.log(`Deleted ${itemSessions.count} item sessions.`);

    // 2. Delete Learning Sessions (Dependent on Module)
    const learningSessions = await prisma.learningSession.deleteMany({});
    console.log(`Deleted ${learningSessions.count} learning sessions.`);

    // 3. Delete Progress Data (Dependent on Item)
    const itemProgress = await prisma.itemProgress.deleteMany({});
    console.log(`Deleted ${itemProgress.count} item progress records.`);

    const sm2Progress = await prisma.sM2Progress.deleteMany({});
    console.log(`Deleted ${sm2Progress.count} SM2 progress records.`);

    const userQuestionOverride = await prisma.userQuestionOverride.deleteMany({});
    console.log(`Deleted ${userQuestionOverride.count} question overrides.`);

    // 4. Delete Library & Collection Relations (Dependent on Module/Collection)
    const userModuleLibrary = await prisma.userModuleLibrary.deleteMany({});
    console.log(`Deleted ${userModuleLibrary.count} module library entries.`);

    const collectionItems = await prisma.collectionItem.deleteMany({});
    console.log(`Deleted ${collectionItems.count} collection items.`);

    // 5. Delete Items (Dependent on Module - usually cascades, but good to be explicit/safe if constraints vary)
    // Note: If Module->Item is Cascade, deleting Module is enough. But verify schema.
    // Schema says: Item -> Module (onDelete: Cascade). So deleting module deletes items.
    // However, we must ensure nothing else depends on Item (we handled Progress/Sessions above).

    // 6. Delete Modules
    const modules = await prisma.module.deleteMany({});
    console.log(`Deleted ${modules.count} modules.`);

    // Optional: Delete Collections too? User said "modules", but "test modules" might imply everything content-related.
    // Let's stick to modules as requested, but empty collections might remain.
    // User said "tüm modülleri siler misin", so modules specifically.

    console.log("Database cleanup complete.");
}

main()
    .catch(e => {
        console.error("Error during cleanup:", e);
        process.exit(1);
    })
    .finally(async () => await prisma.$disconnect());
