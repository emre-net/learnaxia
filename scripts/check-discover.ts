import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const allModules = await prisma.module.findMany({
        where: { status: 'ACTIVE', isForkable: true },
        select: { title: true }
    });

    const allCollections = await prisma.collection.findMany({
        where: { isPublic: true },
        select: { title: true }
    });

    console.log(`--- KEŞFET ANALİZİ ---`);
    console.log(`Aktif ve Forkable Modül Sayısı: ${allModules.length}`);
    allModules.forEach(m => console.log(`  > [Modül] ${m.title}`));

    console.log(`\nHerkese Açık Koleksiyon Sayısı: ${allCollections.length}`);
    allCollections.forEach(c => console.log(`  > [Koleksiyon] ${c.title}`));
    console.log(`-----------------------`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
