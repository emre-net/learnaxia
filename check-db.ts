
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    const modules = await prisma.module.findMany({
        select: { id: true, title: true, status: true, isForkable: true, ownerId: true }
    });
    console.log("TOTAL MODULES:", modules.length);
    console.log("SAMPLES:", modules.slice(0, 5));

    const users = await prisma.user.findMany({
        select: { id: true, email: true }
    });
    console.log("TOTAL USERS:", users.length);

    const lib = await prisma.userModuleLibrary.findMany();
    console.log("TOTAL LIB ENTRIES:", lib.length);
}

check().catch(console.error).finally(() => prisma.$disconnect());
