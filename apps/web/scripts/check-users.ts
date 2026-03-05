import prisma from "../lib/prisma.js";

async function main() {
    try {
        console.log("--- All Users ---");
        const users = await prisma.user.findMany({
            select: { id: true, email: true, name: true, handle: true }
        });
        console.log(JSON.stringify(users, null, 2));

        console.log("\n--- All Modules with Owners ---");
        const modules = await prisma.module.findMany({
            select: { id: true, title: true, ownerId: true, creatorId: true }
        });
        console.log(JSON.stringify(modules, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
