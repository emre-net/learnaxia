/**
 * Learnaxia — Özel Rozet Sistemi
 * Tier'dan bağımsız, başarıya dayalı rozetler.
 */

export type BadgeKey =
    | 'egitmen'
    | 'viral_icerik'
    | 'uretici'
    | 'hassas'
    | 'duzenli'
    | 'sm2_ustasi'
    | 'derin_ogrenme'
    | 'topluluk_yildizi';

export interface Badge {
    key: BadgeKey;
    label: string;
    description: string;
    emoji: string;
    color: string;
}

export const BADGE_DEFINITIONS: Record<BadgeKey, Badge> = {
    egitmen: {
        key: 'egitmen',
        label: 'Eğitmen',
        description: '20+ farklı kullanıcı modülünü aktif olarak çalıştı',
        emoji: '🏫',
        color: '#3B82F6',
    },
    viral_icerik: {
        key: 'viral_icerik',
        label: 'Viral İçerik',
        description: 'Bir modülün 50+ kez kütüphaneye eklendi',
        emoji: '🚀',
        color: '#F59E0B',
    },
    uretici: {
        key: 'uretici',
        label: 'Üretici',
        description: '5+ public modül oluşturdu',
        emoji: '⚒️',
        color: '#8B5CF6',
    },
    hassas: {
        key: 'hassas',
        label: 'Hassas',
        description: '30 günlük ortalama doğruluk ≥ %90',
        emoji: '🎯',
        color: '#10B981',
    },
    duzenli: {
        key: 'duzenli',
        label: 'Düzenli',
        description: 'Bir ayda 20+ farklı gün aktif çalıştı',
        emoji: '📅',
        color: '#06B6D4',
    },
    sm2_ustasi: {
        key: 'sm2_ustasi',
        label: 'SM-2 Ustası',
        description: 'Aylık 200+ SM-2 zamanında kart tekrarı',
        emoji: '🧠',
        color: '#7C3AED',
    },
    derin_ogrenme: {
        key: 'derin_ogrenme',
        label: 'Derin Öğrenen',
        description: 'Zor kartlarda (güç < %40) ≥ %75 başarı',
        emoji: '🌊',
        color: '#1D4ED8',
    },
    topluluk_yildizi: {
        key: 'topluluk_yildizi',
        label: 'Topluluk Yıldızı',
        description: 'İçerikleri toplam 100+ kez aktif çalışıldı',
        emoji: '⭐',
        color: '#F59E0B',
    },
};

export interface BadgeInput {
    contentAdoptionCount: number;       // toplam unique çalışan
    maxModuleSaveCount: number;         // en çok kaydedilen modülün save sayısı
    publicModulesCreated: number;       // public modül sayısı
    last30DayAccuracy: number;          // 0.0 – 1.0
    activeDaysThisMonth: number;        // bu ay aktif gün
    sm2OnTimeCardsThisMonth: number;    // bu ay zamanında SM-2 kart
    hardCardAccuracy: number;           // 0.0 – 1.0, strengthScore < 0.4 olanlar
    totalContentStudies: number;        // toplam aktif içerik çalışma
}

/**
 * Verilen metriklere göre kazanılan rozetlerin key listesini döner.
 * Hiçbir zaman tam eşiği kullanıcıya açıklama — sadece rozet göster.
 */
export function computeEarnedBadges(input: BadgeInput): BadgeKey[] {
    const earned: BadgeKey[] = [];

    if (input.contentAdoptionCount >= 20)       earned.push('egitmen');
    if (input.maxModuleSaveCount >= 50)          earned.push('viral_icerik');
    if (input.publicModulesCreated >= 5)         earned.push('uretici');
    if (input.last30DayAccuracy >= 0.90)        earned.push('hassas');
    if (input.activeDaysThisMonth >= 20)        earned.push('duzenli');
    if (input.sm2OnTimeCardsThisMonth >= 200)   earned.push('sm2_ustasi');
    if (input.hardCardAccuracy >= 0.75)         earned.push('derin_ogrenme');
    if (input.totalContentStudies >= 100)       earned.push('topluluk_yildizi');

    return earned;
}

/**
 * Badge key listesini tam Badge objelerine çevirir
 */
export function getBadgeDetails(keys: BadgeKey[]): Badge[] {
    return keys.map(k => BADGE_DEFINITIONS[k]);
}
