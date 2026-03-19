import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const modules = await prisma.module.findMany({
        select: {
            id: true,
            title: true,
            status: true,
            isForkable: true,
            ownerId: true,
        }
    });

    console.log(`--- Veritabanındaki Tüm Modüller (${modules.length} adet) ---`);
    modules.forEach(m => {
        console.log(`[Status: ${m.status}] [Forkable: ${m.isForkable}] ${m.title} (Owner: ${m.ownerId})`);
    });
    console.log("---------------------------------------------------------");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
