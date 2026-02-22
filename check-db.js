
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const modules = await prisma.module.findMany({
            select: { id: true, title: true, status: true, isForkable: true, ownerId: true }
        });
        console.log("TOTAL MODULES:", modules.length);
        console.log("SAMPLES:", JSON.stringify(modules.slice(0, 5), null, 2));

        const lib = await prisma.userModuleLibrary.findMany();
        console.log("TOTAL LIB ENTRIES:", lib.length);

        const sessions = await prisma.session.count();
        console.log("TOTAL SESSIONS:", sessions);
    } catch (e) {
        console.error("DB CHECK ERROR:", e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
