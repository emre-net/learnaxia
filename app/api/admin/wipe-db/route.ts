import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST() {
    // SECURITY WARNING: In a real app, ensure this is protected by Admin role checks.
    // Given the context of a development/testing environment reset request:
    try {
        console.log("Starting full database wipe (excluding users)...");

        // Use Prisma transactions to ensure atomicity and handle relations correctly.
        // We delete in reverse order of constraints (children first, then parents).
        await prisma.$transaction([
            // 1. Delete Interactions and Progress
            prisma.itemSession.deleteMany({}),
            prisma.learningSession.deleteMany({}),
            prisma.sM2Progress.deleteMany({}),
            prisma.itemProgress.deleteMany({}),
            prisma.userQuestionOverride.deleteMany({}),

            // 2. Delete Libraries & Access
            prisma.userModuleLibrary.deleteMany({}),
            prisma.userCollectionLibrary.deleteMany({}),
            prisma.userContentAccess.deleteMany({}),

            // 3. Delete Notes & Solved Questions
            prisma.note.deleteMany({}),
            prisma.solvedQuestion.deleteMany({}),

            // 4. Delete Exams & Attempts
            prisma.examAttempt.deleteMany({}),
            prisma.exam.deleteMany({}),

            // 5. Delete Core Structure (Items, Modules, Collections)
            prisma.collectionItem.deleteMany({}),
            prisma.item.deleteMany({}),
            prisma.collection.deleteMany({}),
            prisma.module.updateMany({ data: { sourceModuleId: null } }),
            prisma.module.deleteMany({}), // This will cascade delete forks since sourceModuleId is optional but relates to Module

            // 6. Miscellanous
            prisma.pDFAsset.deleteMany({}),
            prisma.weaknessReport.deleteMany({}),
            prisma.systemLog.deleteMany({}),
        ]);

        console.log("Database wipe completed successfully.");
        return NextResponse.json({ success: true, message: "Tüm içerik veritabanları (kullanıcılar hariç) başarıyla sıfırlandı." });

    } catch (error: any) {
        console.error("Database wipe failed:", error);

        try {
            await prisma.systemLog.create({
                data: {
                    level: 'ERROR',
                    environment: process.env.NODE_ENV || 'development',
                    service: 'api/wipe-db',
                    source: 'SERVER',
                    message: `Veritabanı sıfırlama hatası (wipe-db API): ${error.message || String(error)}`,
                    stack: error.stack
                }
            });
        } catch (logError) {
            console.error("Failed to write to systemLog:", logError);
        }

        return NextResponse.json({ success: false, error: "Veritabanı sıfırlanırken bir hata oluştu. Detaylar için Admin Log'a bakın.", details: String(error) }, { status: 500 });
    }
}
