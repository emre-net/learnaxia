import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const allModules = await prisma.module.findMany({
        select: {
            id: true,
            title: true,
            status: true,
            isForkable: true,
            ownerId: true,
        }
    });

    const activeCount = allModules.filter(m => m.status === 'ACTIVE').length;
    const forkableCount = allModules.filter(m => m.isForkable === true).length;
    const bothCount = allModules.filter(m => m.status === 'ACTIVE' && m.isForkable === true).length;

    console.log(`Toplam Modül: ${allModules.length}`);
    console.log(`ACTIVE Sayısı: ${activeCount}`);
    console.log(`isForkable: true Sayısı: ${forkableCount}`);
    console.log(`Her İki Şartı Sağlayan (Keşfet'te görülmesi gereken): ${bothCount}`);
    console.log("---------------------------------------------------------");

    for (const m of allModules) {
        console.log(`> [${m.status}] [Forkable: ${m.isForkable}] ${m.title}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
