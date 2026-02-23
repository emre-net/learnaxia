import prisma from "../lib/prisma.js";

async function main() {
    try {
        console.log("Testing findUnique with non-UUID id...");
        const user = await prisma.user.findUnique({
            where: { id: "virtual-admin" }
        });
        console.log("Result:", user);
    } catch (error: any) {
        console.error("CAUGHT ERROR:", error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
