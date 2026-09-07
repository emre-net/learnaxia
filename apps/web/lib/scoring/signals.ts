/**
 * Learnaxia — Momentum Sinyal Hesaplayıcılar
 *
 * Her sinyal 0–100 aralığına normalize edilir.
 * Ağırlıklar ve kombinasyon engine.ts'de yapılır.
 * Bu dosya sadece ham sinyal değerlerini hesaplar.
 */

import prisma from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────────────────────
// Yardımcı tipler
// ─────────────────────────────────────────────────────────────────────────────

export interface SignalResult {
    // Görünür metrikler (API'de kullanıcıya döner)
    studyMinutes: number;
    cardsReviewed: number;
    accuracyRate: number;       // 0.0 – 1.0
    modulesCreated: number;     // FLASHCARD + MC + GAP + TRUE_FALSE toplamı
    collectionsCreated: number; // oluşturulan koleksiyon sayısı
    notesCreated: number;       // oluşturulan not sayısı
    journeysCreated: number;    // oluşturulan journey sayısı
    journeyCompletions: number; // tamamlanan journey sayısı
    activeDays: number;

    // Gizli sinyal skorları (0.0 – 1.0 normalize)
    sm2AdherenceScore: number;
    sessionSpreadScore: number;
    accuracyTrendScore: number;
    reviewDepthScore: number;
    contentAdoption: number;
    contentQuality: number;

    // Anti-gaming
    velocityPenalty: number;
    patternPenalty: number;

    // Badge input (ham değerler)
    maxModuleSaveCount: number;
    publicModulesCreated: number;
    last30DayAccuracy: number;
    activeDaysThisMonth: number;
    sm2OnTimeCardsThisMonth: number;
    hardCardAccuracy: number;
    totalContentStudies: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Yardımcı fonksiyonlar
// ─────────────────────────────────────────────────────────────────────────────

/** Sayıyı [min, max] aralığına kısar */
function clamp(val: number, min = 0, max = 1): number {
    return Math.min(max, Math.max(min, val));
}

/** Period başlangıç tarihi: ay ilk günü 00:00 UTC */
export function periodStart(date: Date = new Date()): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/** N gün önce */
function daysAgo(n: number): Date {
    return new Date(Date.now() - n * 86_400_000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Ana sinyal toplama fonksiyonu
// ─────────────────────────────────────────────────────────────────────────────

export async function collectSignals(
    userId: string,
    period: Date = periodStart()
): Promise<SignalResult> {
    const periodEnd = new Date(
        Date.UTC(period.getUTCFullYear(), period.getUTCMonth() + 1, 1)
    );

    // ── 1. OTURUM LOGLARI ───────────────────────────────────────────────────
    // StudySessionLog: tüm modül tipleri (FLASHCARD, MC, GAP, TRUE_FALSE)
    // için aynı tablo kullanılır. Tip ayrımı yapılmaz — hepsi eşit değerde.
    const sessionLogs = await prisma.studySessionLog.findMany({
        where: { userId, startedAt: { gte: period, lt: periodEnd } },
        select: {
            durationSec: true,
            cardsAttempted: true,
            cardsCorrect: true,
            accuracyRate: true,
            startedAt: true,
            sm2DueCards: true,
            sm2OnTimeCards: true,
        },
        orderBy: { startedAt: 'asc' },
    });

    // Geriye dönük uyumluluk: StudySessionLog henüz dolmamışsa
    // LearningSession + ItemSession'dan ham veri çek
    const hasLogData = sessionLogs.length > 0;
    const legacySessions = !hasLogData
        ? await prisma.learningSession.findMany({
              where: { userId, startedAt: { gte: period, lt: periodEnd } },
              include: {
                  itemSessions: {
                      select: { durationMs: true, result: true, createdAt: true },
                  },
              },
          })
        : [];

    // ── 2. STUDY MİNUTES ────────────────────────────────────────────────────
    // StudySessionLog varsa oradan; yoksa legacy ItemSession.durationMs kullan
    const dailyMinutes: Record<string, number> = {};
    if (hasLogData) {
        for (const log of sessionLogs) {
            const dayKey = log.startedAt.toISOString().slice(0, 10);
            dailyMinutes[dayKey] = (dailyMinutes[dayKey] ?? 0) + log.durationSec / 60;
        }
    } else {
        for (const ls of legacySessions) {
            const dayKey = ls.startedAt.toISOString().slice(0, 10);
            const totalMs = ls.itemSessions.reduce((s, is) => s + is.durationMs, 0);
            dailyMinutes[dayKey] = (dailyMinutes[dayKey] ?? 0) + totalMs / 60_000;
        }
    }
    // Günde maks 90dk sayılır
    const studyMinutes = Object.values(dailyMinutes).reduce(
        (sum, mins) => sum + Math.min(90, mins),
        0
    );

    // ── 3. CARDS REVIEWED (Tüm modül tipleri — günde azalan getiri) ─────────
    // FLASHCARD, MC, GAP, TRUE_FALSE hepsi eşit değerde sayılır.
    const dailyCards: Record<string, number> = {};
    if (hasLogData) {
        for (const log of sessionLogs) {
            const dayKey = log.startedAt.toISOString().slice(0, 10);
            dailyCards[dayKey] = (dailyCards[dayKey] ?? 0) + log.cardsAttempted;
        }
    } else {
        for (const ls of legacySessions) {
            const dayKey = ls.startedAt.toISOString().slice(0, 10);
            dailyCards[dayKey] = (dailyCards[dayKey] ?? 0) + ls.itemSessions.length;
        }
    }
    const cardsReviewed = Object.values(dailyCards).reduce((sum, cards) => {
        const tier1 = Math.min(50, cards);
        const tier2 = Math.max(0, Math.min(50, cards - 50));
        const tier3 = Math.max(0, cards - 100);
        return sum + tier1 + tier2 * 0.5 + tier3 * 0.25;
    }, 0);

    // ── 4. AKTİF GÜNLER ───────────────────────────────────────────────────
    const activeDays = Object.keys(dailyMinutes).length;

    // ── 5. ACCURACY RATE (Tüm modül tipleri — bu ay) ──────────────────────
    let totalAttempted = 0, totalCorrect = 0;
    if (hasLogData) {
        totalAttempted = sessionLogs.reduce((s, l) => s + l.cardsAttempted, 0);
        totalCorrect   = sessionLogs.reduce((s, l) => s + l.cardsCorrect, 0);
    } else {
        for (const ls of legacySessions) {
            for (const is of ls.itemSessions) {
                totalAttempted++;
                if (is.result === 'CORRECT') totalCorrect++;
            }
        }
    }
    const accuracyRate = totalAttempted > 0 ? totalCorrect / totalAttempted : 0;

    // ── 6. SM-2 ADHERENCE ─────────────────────────────────────────────────
    const totalDue = sessionLogs.reduce((s, l) => s + l.sm2DueCards, 0);
    const totalOnTime = sessionLogs.reduce((s, l) => s + l.sm2OnTimeCards, 0);
    const sm2AdherenceScore = totalDue > 0 ? clamp(totalOnTime / totalDue) : 0;
    const sm2OnTimeCardsThisMonth = totalOnTime;

    // ── 7. SESSION SPREAD ─────────────────────────────────────────────────
    // Her günde kaç farklı oturum var? İdeal: 2-3
    const sessionsPerDay: Record<string, number> = {};
    for (const log of sessionLogs) {
        const dayKey = log.startedAt.toISOString().slice(0, 10);
        sessionsPerDay[dayKey] = (sessionsPerDay[dayKey] ?? 0) + 1;
    }
    const avgSessionsPerDay =
        Object.values(sessionsPerDay).reduce((s, v) => s + v, 0) /
        Math.max(1, Object.keys(sessionsPerDay).length);
    // 2-3 oturum/gün = 1.0, 1 oturum = 0.5, 4+ = 0.7
    const sessionSpreadScore =
        avgSessionsPerDay >= 2 && avgSessionsPerDay <= 3
            ? 1.0
            : avgSessionsPerDay === 1
            ? 0.5
            : clamp(1 - (avgSessionsPerDay - 3) * 0.1);

    // ── 8. ACCURACY TREND ─────────────────────────────────────────────────
    const last7 = sessionLogs.filter(l => l.startedAt >= daysAgo(7));
    const prev7 = sessionLogs.filter(
        l => l.startedAt >= daysAgo(14) && l.startedAt < daysAgo(7)
    );
    const avgLast7 =
        last7.length > 0
            ? last7.reduce((s, l) => s + l.accuracyRate, 0) / last7.length
            : 0;
    const avgPrev7 =
        prev7.length > 0
            ? prev7.reduce((s, l) => s + l.accuracyRate, 0) / prev7.length
            : avgLast7;
    const delta = avgLast7 - avgPrev7; // -1 ile +1 arası
    // Normalize: -0.1 delta → 0.0 skor, 0 delta → 0.5, +0.1 delta → 1.0
    const accuracyTrendScore = clamp(0.5 + delta * 5);

    // ── 9. REVIEW DEPTH (Zor kartlar) ─────────────────────────────────────
    const weakItems = await prisma.itemProgress.findMany({
        where: { userId, strengthScore: { lt: 0.4 } },
        select: { correctCount: true, wrongCount: true },
    });
    const weakTotal = weakItems.reduce((s, i) => s + i.correctCount + i.wrongCount, 0);
    const weakCorrect = weakItems.reduce((s, i) => s + i.correctCount, 0);
    const hardCardAccuracy = weakTotal > 0 ? weakCorrect / weakTotal : 0;
    const reviewDepthScore = clamp(hardCardAccuracy);

    // ── 10. ÜRETİM METRİKLERİ ────────────────────────────────────────────
    // Tüm modül tipleri (FLASHCARD, MC, GAP, TRUE_FALSE) eşit değerde sayılır.
    // type filtresi YOK — platforma yeni tip eklenince otomatik kapsanır.
    const [
        publicModulesCreated,
        privateModulesCreated,
        collectionsCreated,
        notesCreated,
        journeysCreated,
    ] = await Promise.all([
        prisma.module.count({
            where: { creatorId: userId, visibility: 'PUBLIC', archivedAt: null },
        }),
        prisma.module.count({
            where: {
                creatorId: userId,
                visibility: 'PRIVATE',
                archivedAt: null,
                createdAt: { gte: period, lt: periodEnd },
            },
        }),
        // Koleksiyon üretimi — ayrı varlık, ayrı sinyal
        prisma.collection.count({
            where: { ownerId: userId, createdAt: { gte: period, lt: periodEnd } },
        }),
        // Not üretimi
        prisma.note.count({
            where: { userId, createdAt: { gte: period, lt: periodEnd } },
        }),
        // Journey üretimi (sadece ACTIVE + COMPLETED)
        prisma.learningJourney.count({
            where: {
                userId,
                status: { in: ['ACTIVE', 'COMPLETED'] },
                createdAt: { gte: period, lt: periodEnd },
            },
        }),
    ]);
    const modulesCreated = publicModulesCreated + privateModulesCreated;

    // ── 11. JOURNEY COMPLETIONS ───────────────────────────────────────────
    // Journey "tamamlandı" = son slide'a kadar ilerlendi
    // Bu basit: LearningJourney status = COMPLETED
    const journeyCompletions = await prisma.learningJourney.count({
        where: {
            userId,
            status: 'COMPLETED',
            updatedAt: { gte: period, lt: periodEnd },
        },
    });

    // ── 12. CONTENT ADOPTION ──────────────────────────────────────────────
    const adoptionData = await prisma.contentAdoptionLog.aggregate({
        where: { ownerId: userId, counted: true },
        _count: { id: true },
        _avg: { studentAccuracy: true },
    });
    const contentAdoption = adoptionData._count.id;
    const contentQuality = clamp(adoptionData._avg.studentAccuracy ?? 0);

    // ── 13. MAX MODÜL SAVE SAYISI ─────────────────────────────────────────
    const userModules = await prisma.module.findMany({
        where: { ownerId: userId, visibility: 'PUBLIC', archivedAt: null },
        select: { id: true },
    });
    const moduleIds = userModules.map(m => m.id);

    const maxSaveResult =
        moduleIds.length > 0
            ? await prisma.userModuleLibrary.groupBy({
                  by: ['moduleId'],
                  where: { moduleId: { in: moduleIds }, userId: { not: userId } },
                  _count: { userId: true },
                  orderBy: { _count: { userId: 'desc' } },
                  take: 1,
              })
            : [];
    const maxModuleSaveCount = maxSaveResult[0]?._count?.userId ?? 0;

    // ── 14. TOPLAM AKTİF İÇERİK ÇALIŞMA ─────────────────────────────────
    const totalContentStudies =
        moduleIds.length > 0
            ? await prisma.studySessionLog.groupBy({
                  by: ['userId'],
                  where: {
                      moduleId: { in: moduleIds },
                      userId: { not: userId },
                      cardsAttempted: { gte: 5 },
                  },
                  _count: { id: true },
              }).then(r => r.reduce((s, g) => s + g._count.id, 0))
            : 0;

    // ── 15. SON 30 GÜN ACCURACY (badge için) ──────────────────────────────
    const last30Sessions = await prisma.studySessionLog.findMany({
        where: { userId, startedAt: { gte: daysAgo(30) } },
        select: { cardsAttempted: true, cardsCorrect: true },
    });
    const l30Attempted = last30Sessions.reduce((s, l) => s + l.cardsAttempted, 0);
    const l30Correct = last30Sessions.reduce((s, l) => s + l.cardsCorrect, 0);
    const last30DayAccuracy = l30Attempted > 0 ? l30Correct / l30Attempted : 0;

    // ── 16. VELOCITY SPIKE KONTROLÜ ──────────────────────────────────────
    const thisWeekSessions = sessionLogs.filter(
        l => l.startedAt >= daysAgo(7)
    ).length;
    const past4WeekSessions = sessionLogs.length; // period içi tümü ~4 hafta
    const weeklyAvg = past4WeekSessions / 4;
    let velocityPenalty = 0;
    if (weeklyAvg > 0) {
        const ratio = thisWeekSessions / weeklyAvg;
        if (ratio > 3.5) velocityPenalty = 0.35;
        else if (ratio > 2.0) velocityPenalty = 0.15;
    }

    // ── 17. PATTERN ENTROPY KONTROLÜ ─────────────────────────────────────
    const sessionHours = sessionLogs
        .slice(-14 * 5) // son 14 gün, günde maks 5 oturum
        .map(l => l.startedAt.getUTCHours() * 60 + l.startedAt.getUTCMinutes());
    let patternPenalty = 0;
    if (sessionHours.length >= 10) {
        const mean = sessionHours.reduce((s, v) => s + v, 0) / sessionHours.length;
        const variance =
            sessionHours.reduce((s, v) => s + Math.pow(v - mean, 2), 0) /
            sessionHours.length;
        const stdDev = Math.sqrt(variance);
        if (stdDev < 10) patternPenalty = 0.30;      // çok robotik
        else if (stdDev < 30) patternPenalty = 0.10;  // biraz şüpheli
    }

    return {
        // Görünür
        studyMinutes: Math.round(studyMinutes),
        cardsReviewed: Math.round(cardsReviewed),
        accuracyRate,
        modulesCreated,
        collectionsCreated,
        notesCreated,
        journeysCreated,
        journeyCompletions,
        activeDays,
        // Gizli
        sm2AdherenceScore,
        sessionSpreadScore,
        accuracyTrendScore,
        reviewDepthScore,
        contentAdoption,
        contentQuality,
        // Anti-gaming
        velocityPenalty,
        patternPenalty,
        // Badge raw
        maxModuleSaveCount,
        publicModulesCreated,
        last30DayAccuracy,
        activeDaysThisMonth: activeDays,
        sm2OnTimeCardsThisMonth,
        hardCardAccuracy,
        totalContentStudies,
    };
}
