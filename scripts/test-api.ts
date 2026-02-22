import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function mockApiCall(type: string) {
    const limit = 20;
    const offset = 0;

    if (type === "COLLECTION") {
        const where = { isPublic: true };
        const [collections, total] = await Promise.all([
            prisma.collection.findMany({ where, take: limit, skip: offset }),
            prisma.collection.count({ where })
        ]);
        return { items: collections, total, type: "COLLECTION" };
    } else {
        const where = { isForkable: true, status: "ACTIVE" };
        const [modules, total] = await Promise.all([
            prisma.module.findMany({ where, take: limit, skip: offset }),
            prisma.module.count({ where })
        ]);
        return { items: modules, total, type: "MODULE" };
    }
}

async function main() {
    console.log("--- MOCK API TEST ---");
    const moduleResult = await mockApiCall("MODULE");
    console.log("Modules API:", { itemsCount: moduleResult.items.length, total: moduleResult.total });

    const collectionResult = await mockApiCall("COLLECTION");
    console.log("Collections API:", { itemsCount: collectionResult.items.length, total: collectionResult.total });
    console.log("----------------------");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
