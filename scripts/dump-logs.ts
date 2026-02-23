import prisma from "../lib/prisma.js";
import fs from "fs";

async function main() {
    try {
        const lastLogs = await prisma.systemLog.findMany({
            where: { level: 'CRITICAL' },
            take: 5,
            orderBy: { createdAt: 'desc' },
        });

        fs.writeFileSync('scripts/error_dump.json', JSON.stringify(lastLogs, null, 2));
        console.log("Successfully wrote logs to scripts/error_dump.json");
    } catch (error) {
        console.error("Error fetching logs:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
