const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
    const email = "netemre387@gmail.com";
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (user) {
        console.log(`User found: ${user.email}`);
        console.log(`Role: ${user.role}`);
        console.log(`ID: ${user.id}`);
    } else {
        console.log(`User ${email} NOT found in database.`);
    }

    await prisma.$disconnect();
}

checkUser();
