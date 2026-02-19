const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const usersWithoutHandle = await prisma.user.findMany({
        where: { handle: null }
    });

    console.log(`Found ${usersWithoutHandle.length} users without handle.`);

    for (const user of usersWithoutHandle) {
        if (!user.email) {
            console.log(`Skipping user ${user.id} (no email)`);
            continue;
        }

        const emailPrefix = user.email.split('@')[0];
        const baseHandle = emailPrefix.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        let handle = baseHandle || `user${Math.floor(Math.random() * 10000)}`;

        // Ensure uniqueness
        let attempts = 0;
        let finalHandle = handle;
        while (attempts < 5) {
            const existing = await prisma.user.findUnique({ where: { handle: finalHandle } });
            if (!existing) break;
            finalHandle = `${handle}${Math.floor(Math.random() * 1000)}`;
            attempts++;
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { handle: finalHandle }
        });

        console.log(`Updated user ${user.email} -> handle: ${finalHandle}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
