/**
 * Learnaxia — Tier Sistemi Tanımları
 * Etki puanına göre kullanıcı seviyesi belirlenir.
 */

export type TierKey = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface Tier {
    key: TierKey;
    label: string;        // Türkçe isim
    labelEn: string;
    emoji: string;
    color: string;        // Hex — UI'da kullanılır
    gradientFrom: string;
    gradientTo: string;
    minScore: number;
    maxScore: number | null;
}

export const TIERS: Tier[] = [
    {
        key: 'bronze',
        label: 'Bronz',
        labelEn: 'Bronze',
        emoji: '🥉',
        color: '#CD7F32',
        gradientFrom: '#CD7F32',
        gradientTo: '#A0522D',
        minScore: 0,
        maxScore: 499,
    },
    {
        key: 'silver',
        label: 'Gümüş',
        labelEn: 'Silver',
        emoji: '🥈',
        color: '#C0C0C0',
        gradientFrom: '#C0C0C0',
        gradientTo: '#A8A9AD',
        minScore: 500,
        maxScore: 1999,
    },
    {
        key: 'gold',
        label: 'Altın',
        labelEn: 'Gold',
        emoji: '🥇',
        color: '#FFD700',
        gradientFrom: '#FFD700',
        gradientTo: '#FFA500',
        minScore: 2000,
        maxScore: 7499,
    },
    {
        key: 'platinum',
        label: 'Platin',
        labelEn: 'Platinum',
        emoji: '💠',
        color: '#00CED1',
        gradientFrom: '#00CED1',
        gradientTo: '#008B8B',
        minScore: 7500,
        maxScore: 19999,
    },
    {
        key: 'diamond',
        label: 'Elmas',
        labelEn: 'Diamond',
        emoji: '💎',
        color: '#B9F2FF',
        gradientFrom: '#B9F2FF',
        gradientTo: '#00BFFF',
        minScore: 20000,
        maxScore: null,
    },
];

/**
 * Verilen Etki puanına göre tier döner
 */
export function getTierForScore(score: number): Tier {
    for (let i = TIERS.length - 1; i >= 0; i--) {
        if (score >= TIERS[i].minScore) return TIERS[i];
    }
    return TIERS[0]; // fallback: bronz
}

/**
 * Bir sonraki tier'a kaç puan kaldığını döner
 * Diamond için null döner (zirve)
 */
export function getPointsToNextTier(score: number): number | null {
    const current = getTierForScore(score);
    if (current.maxScore === null) return null;
    return current.maxScore + 1 - score;
}

/**
 * Tier içindeki ilerleme yüzdesi (0–100)
 */
export function getTierProgress(score: number): number {
    const tier = getTierForScore(score);
    if (tier.maxScore === null) return 100;
    const range = tier.maxScore - tier.minScore + 1;
    const progress = score - tier.minScore;
    return Math.min(100, Math.round((progress / range) * 100));
}
