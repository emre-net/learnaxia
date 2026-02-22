const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function promoteAdmin() {
    const email = "netemre387@gmail.com";
    try {
        const updatedUser = await prisma.user.update({
            where: { email },
            data: { role: 'ADMIN' }
        });
        console.log(`Success: User ${updatedUser.email} is now an ADMIN.`);
    } catch (error) {
        console.error(`Error: Could not find or update user ${email}.`, error);
    }
    await prisma.$disconnect();
}

promoteAdmin();
