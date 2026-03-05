import prisma from "../lib/prisma.js";

async function main() {
    try {
        console.log("--- Recent System Logs (ERROR) ---");
        const logs = await prisma.systemLog.findMany({
            where: { level: 'ERROR' },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
        console.log(JSON.stringify(logs, null, 2));

        console.log("\n--- Recent System Logs (ALL) ---");
        const allLogs = await prisma.systemLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        console.log(JSON.stringify(allLogs, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
