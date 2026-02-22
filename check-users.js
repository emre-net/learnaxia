
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const users = await prisma.user.count();
        console.log("TOTAL USERS:", users);

        const allUsers = await prisma.user.findMany({ select: { id: true, email: true, name: true } });
        console.log("USERS:", JSON.stringify(allUsers, null, 2));

    } catch (e) {
        console.error("DB CHECK ERROR:", e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
