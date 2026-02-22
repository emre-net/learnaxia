
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

// Manual .env loading
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    envContent.split("\n").forEach(line => {
        const [key, ...valueParts] = line.split("=");
        if (key && valueParts.length > 0) {
            const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
            process.env[key.trim()] = value;
        }
    });
}

const prisma = new PrismaClient();

async function main() {
    console.log("--- DB DIAGNOSTIC START ---");
    console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);

    try {
        const moduleCount = await prisma.module.count();
        console.log(`Total Modules in DB: ${moduleCount}`);

        if (moduleCount > 0) {
            const modules = await prisma.module.findMany({
                take: 20,
                select: {
                    id: true,
                    title: true,
                    status: true,
                    visibility: true,
                    isForkable: true,
                    owner: { select: { handle: true } }
                }
            });

            console.log("\nSample Modules Info:");
            modules.forEach(m => {
                console.log(`- [${m.status}] [${m.visibility}] [Forkable: ${m.isForkable}] ${m.title} (Owner: @${m.owner?.handle})`);
            });

            const publicActiveModules = await prisma.module.count({
                where: {
                    status: "ACTIVE",
                    visibility: "PUBLIC",
                    isForkable: true
                }
            });
            console.log(`\nModules that should be visible in Discover (ACTIVE & PUBLIC & Forkable): ${publicActiveModules}`);
        }

        const collectionCount = await prisma.collection.count();
        console.log(`\nTotal Collections in DB: ${collectionCount}`);
    } catch (err) {
        console.error("Query failed:", err);
    }

    console.log("\n--- DB DIAGNOSTIC END ---");
}

main()
    .catch((e) => {
        console.error("Diagnostic failed:", e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
