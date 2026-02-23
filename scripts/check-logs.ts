import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.systemLog.count();
        console.log(`Total logs: ${count}`);

        const lastLogs = await prisma.systemLog.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                level: true,
                message: true,
                createdAt: true,
                source: true
            }
        });

        console.log("Last 5 logs:");
        console.log(JSON.stringify(lastLogs, null, 2));
    } catch (error) {
        console.error("Error fetching logs:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
