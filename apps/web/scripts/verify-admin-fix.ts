import prisma from "../lib/prisma.js";

async function main() {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
        console.error("ADMIN_EMAIL not set");
        return;
    }

    try {
        console.log(`--- Checking Admin User: ${adminEmail} ---`);
        const admin = await prisma.user.findUnique({
            where: { email: adminEmail },
            include: { moduleLibrary: true, wallet: true }
        });

        if (!admin) {
            console.log("Admin user does not exist in DB yet. This is expected if nobody has logged in as admin yet after the code change.");
            return;
        }

        console.log("Admin ID:", admin.id);
        console.log("Admin Role:", admin.role);
        console.log("Library Count:", admin.moduleLibrary.length);
        console.log("Wallet Balance:", admin.wallet?.balance);

        console.log("\n--- Testing Module Creation for Admin ---");
        // We will just verify if the ID is a valid source for a module
        const testModule = await prisma.module.create({
            data: {
                title: "Admin Test Module",
                type: "FLASHCARD",
                ownerId: admin.id,
                creatorId: admin.id,
                status: "DRAFT"
            }
        });
        console.log("Module created successfully with ID:", testModule.id);

        // Add to library
        await prisma.userModuleLibrary.create({
            data: {
                userId: admin.id,
                moduleId: testModule.id,
                role: "OWNER"
            }
        });
        console.log("Module added to admin library successfully.");

        // Cleanup
        await prisma.userModuleLibrary.delete({ where: { userId_moduleId: { userId: admin.id, moduleId: testModule.id } } });
        await prisma.module.delete({ where: { id: testModule.id } });
        console.log("Test cleanup done.");

    } catch (e) {
        console.error("Verification failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
