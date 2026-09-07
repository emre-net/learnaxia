/**
 * Learnaxia — StudySession Logging Utility
 *
 * Her kart cevabında çağrılır.
 * StudySessionLog tablosunu upsert eder — session bazlı istatistik tutar.
 * Tüm modül tipleri (FLASHCARD, MC, GAP, TRUE_FALSE) eşit ele alınır.
 */

import prisma from "@/lib/prisma";

interface SessionLogData {
    userId: string;
    learningSessionId: string; // LearningSession.id (mevcut)
    moduleId: string;
    source: 'study' | 'journey' | 'quick_review' | 'daily_review';
    itemId: string;
    isCorrect: boolean;
    durationMs: number;
    // SM-2 verisi (ProgressService'den gelir)
    sm2WasDue: boolean;     // Bu kart bugün vadesi gelmişti
    sm2WasOnTime: boolean;  // Vadesi gelmişti ve zamanında yapıldı
}

/**
 * Bir kart cevabı loglanır.
 * StudySessionLog upsert (learningSessionId başına 1 kayıt):
 * - İlk çağrıda oluşturulur
 * - Sonraki çağrılarda increment edilir
 */
export async function logCardResult(data: SessionLogData): Promise<void> {
    try {
        // StudySessionLog mevcut mu?
        const existing = await prisma.studySessionLog.findFirst({
            where: {
                userId: data.userId,
                // LearningSession ile ilişkilendirmek için moduleId + startedAt aynı gün
                moduleId: data.moduleId,
                startedAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)), // bugünün başı
                },
            },
            orderBy: { startedAt: 'desc' },
        });

        if (!existing) {
            // Yeni log oluştur
            await prisma.studySessionLog.create({
                data: {
                    userId: data.userId,
                    moduleId: data.moduleId,
                    source: data.source,
                    startedAt: new Date(),
                    durationSec: Math.round(data.durationMs / 1000),
                    cardsAttempted: 1,
                    cardsCorrect: data.isCorrect ? 1 : 0,
                    accuracyRate: data.isCorrect ? 1 : 0,
                    sm2DueCards: data.sm2WasDue ? 1 : 0,
                    sm2OnTimeCards: data.sm2WasOnTime ? 1 : 0,
                    sm2EarlyCards: data.sm2WasDue && !data.sm2WasOnTime ? 1 : 0,
                },
            });
        } else {
            // Mevcut log'u güncelle
            const newAttempted = existing.cardsAttempted + 1;
            const newCorrect = existing.cardsCorrect + (data.isCorrect ? 1 : 0);
            await prisma.studySessionLog.update({
                where: { id: existing.id },
                data: {
                    endedAt: new Date(),
                    durationSec: existing.durationSec + Math.round(data.durationMs / 1000),
                    cardsAttempted: newAttempted,
                    cardsCorrect: newCorrect,
                    accuracyRate: newCorrect / newAttempted,
                    sm2DueCards: existing.sm2DueCards + (data.sm2WasDue ? 1 : 0),
                    sm2OnTimeCards: existing.sm2OnTimeCards + (data.sm2WasOnTime ? 1 : 0),
                    sm2EarlyCards:
                        existing.sm2EarlyCards +
                        (data.sm2WasDue && !data.sm2WasOnTime ? 1 : 0),
                },
            });
        }
    } catch (err) {
        // Loglama hatası çalışmayı durdurmamalı — sessiz fail
        console.error('[SessionLogger] logCardResult failed:', err);
    }
}

/**
 * SM-2 kart vadesi kontrolü
 * nextReviewAt ±1 gün içinde yapıldıysa "on-time" sayılır
 */
export function isSm2OnTime(nextReviewAt: Date | null | undefined): {
    wasDue: boolean;
    wasOnTime: boolean;
} {
    if (!nextReviewAt) return { wasDue: false, wasOnTime: false };

    const now = Date.now();
    const dueTime = nextReviewAt.getTime();
    const oneDayMs = 86_400_000;

    const wasDue = dueTime <= now + oneDayMs; // 1 gün önce veya vadesi geçmiş
    const wasOnTime = wasDue && dueTime >= now - oneDayMs; // ±1 gün

    return { wasDue, wasOnTime };
}

/**
 * ContentAdoptionLog güncelle — başka biri bir modülü çalışıyor
 * Farming koruması: aynı kullanıcı owner'ın 3+ modülündeyse counted=false
 */
export async function logContentAdoption(
    studentId: string,
    moduleId: string,
    ownerId: string,
    isCorrect: boolean
): Promise<void> {
    if (studentId === ownerId) return; // Kendi içeriğini çalışma sayılmaz

    try {
        // Kaç farklı modülde bu öğrenci aktif?
        const existingAdoptions = await prisma.contentAdoptionLog.count({
            where: { ownerId, studentId, counted: true },
        });

        // 3'ten fazla modül varsa farming şüphesi
        const counted = existingAdoptions < 3;

        await prisma.contentAdoptionLog.upsert({
            where: { moduleId_studentId: { moduleId, studentId } },
            create: {
                moduleId,
                ownerId,
                studentId,
                cardsStudied: 1,
                studentAccuracy: isCorrect ? 1 : 0,
                counted,
            },
            update: {
                cardsStudied: { increment: 1 },
                lastStudyAt: new Date(),
                studentAccuracy: isCorrect ? 1 : 0, // Son kart bazlı (yaklaşım)
                counted, // Her güncellemede farming kontrolü yeniden yapılır
            },
        });
    } catch (err) {
        console.error('[SessionLogger] logContentAdoption failed:', err);
    }
}
