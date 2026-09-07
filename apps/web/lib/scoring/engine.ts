/**
 * Learnaxia — Momentum Hesaplama Motoru
 *
 * Tek entry point: calculateMomentum()
 * Tüm sinyal ağırlıkları, multiplier'lar ve anti-gaming faktörleri burada.
 * Bu dosya kasıtlı olarak "opaque" tasarlanmıştır — kullanıcıya hangi
 * ağırlıkların kullanıldığı hiçbir zaman açıklanmaz.
 */

import prisma from "@/lib/prisma";
import { collectSignals, SignalResult, periodStart } from "./signals";
import { getTierForScore } from "./tiers";
import { computeEarnedBadges, BadgeKey } from "./badges";

// ─────────────────────────────────────────────────────────────────────────────
// Ağırlıklar — gizli, değiştirilebilir, kullanıcıya gösterilmez
// ─────────────────────────────────────────────────────────────────────────────

const W = {
    studyMinutes:       0.80,   // görünür
    cardsReviewed:      0.50,   // görünür
    sm2Adherence:       2.00,   // gizli — en kritik öğrenme sinyali
    accuracyTrend:      1.50,   // gizli
    sessionSpread:      1.20,   // gizli
    reviewDepth:        1.00,   // gizli
    journeyCompletions: 3.00,   // görünür — tamamlama
    modulesCreated:     5.00,   // görünür — FLASHCARD+MC+GAP+TRUE_FALSE hepsi
    collectionsCreated: 2.00,   // görünür — koleksiyon üretimi
    notesCreated:       1.00,   // görünür — not üretimi
    journeysCreated:    4.00,   // görünür — journey üretimi (içerik yoğun)
    contentSaves:       4.00,   // görünür (dolaylı)
    contentStudies:     6.00,   // görünür (dolaylı)
    contentAdoption:    8.00,   // gizli — en yüksek ağırlık
    contentQuality:     6.00,   // gizli
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Sonuç tipi
// ─────────────────────────────────────────────────────────────────────────────

export interface MomentumResult {
    // Final
    finalScore: number;
    tier: string;
    earnedBadges: BadgeKey[];

    // Ara hesaplamalar (audit için, API'de kullanıcıya dönmez)
    rawScore: number;
    qualityMultiplier: number;
    consistencyCoef: number;
    antiGamingFactor: number;

    // Görünür metrikler (kullanıcıya gösterilir)
    visibleMetrics: {
        studyMinutes: number;
        cardsReviewed: number;
        accuracyRate: number;
        modulesCreated: number;       // FLASHCARD + MC + GAP + TRUE_FALSE
        collectionsCreated: number;   // koleksiyon sayısı
        notesCreated: number;         // not sayısı
        journeysCreated: number;      // üretilen journey sayısı
        journeyCompletions: number;   // tamamlanan journey
        activeDays: number;
        contentAdoption: number;
    };

    calculatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Yardımcı: content saves sayısı
// ─────────────────────────────────────────────────────────────────────────────

async function getContentSaves(userId: string): Promise<number> {
    const modules = await prisma.module.findMany({
        where: { ownerId: userId, visibility: 'PUBLIC', archivedAt: null },
        select: { id: true },
    });
    if (modules.length === 0) return 0;

    const moduleIds = modules.map(m => m.id);

    // Farklı kullanıcıların kütüphanesine eklemeleri — farming koruması:
    // Aynı kullanıcı birden fazla modül eklerse, 2. ve 3. için kısıtlama
    const saves = await prisma.userModuleLibrary.groupBy({
        by: ['userId'],
        where: { moduleId: { in: moduleIds }, userId: { not: userId } },
        _count: { moduleId: true },
    });

    let totalScore = 0;
    for (const save of saves) {
        const count = save._count.moduleId;
        // İlk modül tam, 2. yarı, 3.+ sıfır (farming koruması)
        totalScore += Math.min(1, count) + (count >= 2 ? 0.5 : 0);
    }
    return totalScore;
}

// ─────────────────────────────────────────────────────────────────────────────
// Ana hesaplama
// ─────────────────────────────────────────────────────────────────────────────

export async function calculateMomentum(
    userId: string,
    period: Date = periodStart()
): Promise<MomentumResult> {
    // Tüm sinyalleri topla
    const signals: SignalResult = await collectSignals(userId, period);
    const contentSavesScore = await getContentSaves(userId);

    // ── Ham skor ────────────────────────────────────────────────────────────
    const rawScore =
        signals.studyMinutes        * W.studyMinutes        +
        signals.cardsReviewed       * W.cardsReviewed       +
        signals.sm2AdherenceScore   * W.sm2Adherence        +
        signals.accuracyTrendScore  * W.accuracyTrend       +
        signals.sessionSpreadScore  * W.sessionSpread       +
        signals.reviewDepthScore    * W.reviewDepth         +
        signals.journeyCompletions  * W.journeyCompletions  +
        signals.modulesCreated      * W.modulesCreated      +
        signals.collectionsCreated  * W.collectionsCreated  +
        signals.notesCreated        * W.notesCreated        +
        signals.journeysCreated     * W.journeysCreated     +
        contentSavesScore           * W.contentSaves        +
        signals.totalContentStudies * W.contentStudies      +
        signals.contentAdoption     * W.contentAdoption     +
        signals.contentQuality      * W.contentQuality;

    // ── Quality Multiplier: accuracy_rate ^ 1.3 ─────────────────────────────
    // %0 accuracy = 0× | %60 = 0.68× | %90 = 1.17× | %100 = 1.0× (capped)
    const qualityMultiplier = Math.min(
        1.25,
        Math.pow(Math.max(0.01, signals.accuracyRate), 1.3)
    );

    // ── Consistency Coefficient: log(activeDays + 1) / log(8) ───────────────
    // 1 aktif gün = 0.43 | 4 gün = 0.84 | 7 gün = 1.0 | 30 gün = 1.44 (cap)
    const consistencyCoef = Math.min(
        1.5,
        Math.log(signals.activeDays + 1) / Math.log(8)
    );

    // ── Anti-Gaming Faktörü ─────────────────────────────────────────────────
    const antiGamingFactor = Math.max(
        0.1, // minimum 0.1 — tamamen silme
        1.0 - signals.velocityPenalty - signals.patternPenalty
    );

    // ── Final Skor ──────────────────────────────────────────────────────────
    const finalScore = Math.round(
        rawScore * qualityMultiplier * consistencyCoef * antiGamingFactor
    );

    // ── Tier ────────────────────────────────────────────────────────────────
    // Tier için: tüm zamanlar skoru kullanılır; burada period skoru döner.
    // Gerçek tier DB'deki kümülatif finalScore'dan hesaplanır.
    // Bu fonksiyon sadece period puanını döner.
    const tier = getTierForScore(finalScore).key;

    // ── Rozetler ────────────────────────────────────────────────────────────
    const earnedBadges = computeEarnedBadges({
        contentAdoptionCount:       signals.contentAdoption,
        maxModuleSaveCount:         signals.maxModuleSaveCount,
        publicModulesCreated:       signals.publicModulesCreated,
        last30DayAccuracy:          signals.last30DayAccuracy,
        activeDaysThisMonth:        signals.activeDaysThisMonth,
        sm2OnTimeCardsThisMonth:    signals.sm2OnTimeCardsThisMonth,
        hardCardAccuracy:           signals.hardCardAccuracy,
        totalContentStudies:        signals.totalContentStudies,
    });

    return {
        finalScore,
        tier,
        earnedBadges,
        rawScore: Math.round(rawScore * 100) / 100,
        qualityMultiplier: Math.round(qualityMultiplier * 1000) / 1000,
        consistencyCoef: Math.round(consistencyCoef * 1000) / 1000,
        antiGamingFactor: Math.round(antiGamingFactor * 1000) / 1000,
        visibleMetrics: {
            studyMinutes:       signals.studyMinutes,
            cardsReviewed:      Math.round(signals.cardsReviewed),
            accuracyRate:       Math.round(signals.accuracyRate * 1000) / 1000,
            modulesCreated:     signals.modulesCreated,
            collectionsCreated: signals.collectionsCreated,
            notesCreated:       signals.notesCreated,
            journeysCreated:    signals.journeysCreated,
            journeyCompletions: signals.journeyCompletions,
            activeDays:         signals.activeDays,
            contentAdoption:    signals.contentAdoption,
        },
        calculatedAt: new Date(),
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// DB'ye kaydet + kümülatif Tier güncelle
// ─────────────────────────────────────────────────────────────────────────────

export async function saveAndRecalculate(
    userId: string,
    period: Date = periodStart()
): Promise<void> {
    const result = await calculateMomentum(userId, period);

    // Period puanını kaydet
    await prisma.userScore.upsert({
        where: { userId_period: { userId, period } },
        create: {
            userId,
            period,
            // Görünür
            studyMinutes:       result.visibleMetrics.studyMinutes,
            cardsReviewed:      result.visibleMetrics.cardsReviewed,
            accuracyRate:       result.visibleMetrics.accuracyRate,
            modulesCreated:     result.visibleMetrics.modulesCreated,
            journeyCompletions: result.visibleMetrics.journeyCompletions,
            activeDays:         result.visibleMetrics.activeDays,
            contentAdoption:    result.visibleMetrics.contentAdoption,
            // Hesaplanmış
            rawScore:           result.rawScore,
            qualityMultiplier:  result.qualityMultiplier,
            consistencyCoef:    result.consistencyCoef,
            antiGamingFactor:   result.antiGamingFactor,
            finalScore:         result.finalScore,
            tier:               result.tier,
            calculatedAt:       result.calculatedAt,
        },
        update: {
            studyMinutes:       result.visibleMetrics.studyMinutes,
            cardsReviewed:      result.visibleMetrics.cardsReviewed,
            accuracyRate:       result.visibleMetrics.accuracyRate,
            modulesCreated:     result.visibleMetrics.modulesCreated,
            journeyCompletions: result.visibleMetrics.journeyCompletions,
            activeDays:         result.visibleMetrics.activeDays,
            contentAdoption:    result.visibleMetrics.contentAdoption,
            rawScore:           result.rawScore,
            qualityMultiplier:  result.qualityMultiplier,
            consistencyCoef:    result.consistencyCoef,
            antiGamingFactor:   result.antiGamingFactor,
            finalScore:         result.finalScore,
            tier:               result.tier,
            calculatedAt:       result.calculatedAt,
        },
    });

    // Kümülatif (tüm zamanlar) tier hesapla
    const allTimeScore = await prisma.userScore.aggregate({
        where: { userId },
        _sum: { finalScore: true },
    });
    const cumulativeScore = allTimeScore._sum.finalScore ?? 0;
    const allTimeTier = getTierForScore(cumulativeScore).key;

    // User modelinde tüm zamanlar tier'ı saklamak için settings alanını kullan
    // NOT: settings bir JSON alanıdır — direkt atama tüm mevcut ayarları siler.
    // Bu yüzden önce mevcut settings okunup merge yapılır.
    const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { settings: true },
    });
    const existingSettings = (currentUser?.settings as Record<string, unknown>) ?? {};

    await prisma.user.update({
        where: { id: userId },
        data: {
            settings: {
                ...existingSettings,
                allTimeMomentum: cumulativeScore,
                allTimeTier,
                lastScoreCalculatedAt: new Date().toISOString(),
            },
        },
    });
}
