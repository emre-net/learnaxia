const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: { id: true, email: true, handle: true }
    });

    console.log("Total Users:", users.length);
    console.log("Users with missing handle:");
    const missing = users.filter(u => !u.handle);

    if (missing.length === 0) {
        console.log("None! All users have handles.");
    } else {
        missing.forEach(u => {
            console.log(`- ID: ${u.id}, Email: ${u.email}`);
        });
    }

    // Also verify the specific user if possible (we don't know their ID, but list helps)
    console.log("\nSample Users:");
    users.slice(0, 5).forEach(u => console.log(u));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
