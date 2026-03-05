import prisma from "../lib/prisma.js";

async function main() {
    try {
        console.log("--- UserModuleLibrary Count ---");
        const count = await prisma.userModuleLibrary.count();
        console.log("Total entries:", count);

        console.log("\n--- Sample Library Entries ---");
        const samples = await prisma.userModuleLibrary.findMany({
            take: 5,
            include: { module: { select: { title: true, ownerId: true } } }
        });
        console.log(JSON.stringify(samples, null, 2));

        console.log("\n--- Users with Modules ---");
        const users = await prisma.userModuleLibrary.groupBy({
            by: ['userId'],
            _count: { moduleId: true }
        });
        console.log(JSON.stringify(users, null, 2));

        console.log("\n--- Modules Count ---");
        const mCount = await prisma.module.count();
        console.log("Total modules:", mCount);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
