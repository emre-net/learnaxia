import prisma from "@/lib/prisma";
import { saveAndRecalculate } from "@/lib/scoring/engine";
import { periodStart } from "@/lib/scoring/signals";
import { NextResponse } from "next/server";

/**
 * POST /api/cron/recalculate-scores
 * Gece 02:00 UTC'de çalışır (Vercel/Railway cron veya harici tetikleyici).
 * CRON_SECRET header ile korunur.
 *
 * Dün aktif olan tüm kullanıcıların skorunu yeniden hesaplar.
 * Batch: 50 kullanıcı aynı anda, rate limit aşımını önlemek için.
 */
export async function POST(req: Request) {
    // Güvenlik: sadece yetkili cron tetikleyicisi çağırabilir
    const secret = req.headers.get('x-cron-secret');
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const period = periodStart();
        const yesterday = new Date(Date.now() - 86_400_000);

        // Dün aktif olan kullanıcılar (StudySessionLog veya LearningSession)
        const [sessionUsers, legacyUsers] = await Promise.all([
            prisma.studySessionLog.findMany({
                where: { startedAt: { gte: yesterday } },
                select: { userId: true },
                distinct: ['userId'],
            }),
            prisma.learningSession.findMany({
                where: { startedAt: { gte: yesterday } },
                select: { userId: true },
                distinct: ['userId'],
            }),
        ]);

        const userIds = [
            ...new Set([
                ...sessionUsers.map(s => s.userId),
                ...legacyUsers.map(s => s.userId),
            ]),
        ];

        console.info(`[Cron] Recalculating scores for ${userIds.length} users...`);

        // Batch: 50'şer kullanıcı
        const BATCH_SIZE = 50;
        let processed = 0;
        let failed = 0;

        for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
            const batch = userIds.slice(i, i + BATCH_SIZE);
            const results = await Promise.allSettled(
                batch.map(userId => saveAndRecalculate(userId, period))
            );
            processed += results.filter(r => r.status === 'fulfilled').length;
            failed    += results.filter(r => r.status === 'rejected').length;

            // Batch'ler arası kısa bekleme (DB throttle koruması)
            if (i + BATCH_SIZE < userIds.length) {
                await new Promise(r => setTimeout(r, 200));
            }
        }

        console.info(`[Cron] Done. Processed: ${processed}, Failed: ${failed}`);

        return NextResponse.json({
            ok: true,
            period: period.toISOString().slice(0, 7),
            usersProcessed: processed,
            usersFailed: failed,
        });
    } catch (error) {
        console.error("[Cron] recalculate-scores failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
