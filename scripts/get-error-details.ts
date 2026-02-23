import prisma from "../lib/prisma.js";

async function main() {
    try {
        const lastLogs = await prisma.systemLog.findMany({
            where: { level: 'CRITICAL' },
            take: 3,
            orderBy: { createdAt: 'desc' },
        });

        console.log("CRITICAL LOG DETAILS:");
        console.log(JSON.stringify(lastLogs, null, 2));
    } catch (error) {
        console.error("Error fetching logs:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
