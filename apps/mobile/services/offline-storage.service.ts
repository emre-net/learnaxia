import AsyncStorage from '@react-native-async-storage/async-storage';

const MODULE_CACHE_PREFIX = 'learnaxia_module_';
const MODULE_INDEX_KEY = 'learnaxia_offline_module_index';
const SYNC_QUEUE_KEY = 'learnaxia_offline_sync_queue';

export interface OfflineStudyAnswer {
    id: string;
    moduleId: string;
    itemId: string;
    quality: number;
    durationMs: number;
    isCorrect: boolean;
    timestamp: number;
    retryCount: number;
}

export class OfflineStorageService {
    /**
     * Bir modülü çevrimdışı kullanım için yerel önbelleğe kaydeder
     */
    static async cacheModule(moduleData: any): Promise<void> {
        if (!moduleData?.id) return;
        try {
            const key = `${MODULE_CACHE_PREFIX}${moduleData.id}`;
            await AsyncStorage.setItem(key, JSON.stringify(moduleData));

            // İndeksi güncelle
            const rawIndex = await AsyncStorage.getItem(MODULE_INDEX_KEY);
            const index: string[] = rawIndex ? JSON.parse(rawIndex) : [];
            if (!index.includes(moduleData.id)) {
                index.push(moduleData.id);
                await AsyncStorage.setItem(MODULE_INDEX_KEY, JSON.stringify(index));
            }
        } catch (error) {
            console.error('[OfflineStorageService] Error caching module:', error);
        }
    }

    /**
     * Çevrimdışı önbellekten modül verisini getirir
     */
    static async getCachedModule(moduleId: string): Promise<any | null> {
        try {
            const key = `${MODULE_CACHE_PREFIX}${moduleId}`;
            const raw = await AsyncStorage.getItem(key);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (error) {
            console.error('[OfflineStorageService] Error reading cached module:', error);
            return null;
        }
    }

    /**
     * Çevrimdışı kaydedilmiş tüm modüllerin listesini döndürür
     */
    static async getAllCachedModules(): Promise<any[]> {
        try {
            const rawIndex = await AsyncStorage.getItem(MODULE_INDEX_KEY);
            const index: string[] = rawIndex ? JSON.parse(rawIndex) : [];
            const modules = [];

            for (const id of index) {
                const mod = await this.getCachedModule(id);
                if (mod) modules.push(mod);
            }
            return modules;
        } catch (error) {
            console.error('[OfflineStorageService] Error getting all cached modules:', error);
            return [];
        }
    }

    /**
     * İnternet yokken verilen cevabı senkronizasyon kuyruğuna ekler
     */
    static async queueStudyAnswer(payload: {
        moduleId: string;
        itemId: string;
        quality: number;
        durationMs: number;
        isCorrect: boolean;
    }): Promise<void> {
        try {
            const answer: OfflineStudyAnswer = {
                id: `ans_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                moduleId: payload.moduleId,
                itemId: payload.itemId,
                quality: Math.min(Math.max(payload.quality, 0), 5),
                durationMs: payload.durationMs,
                isCorrect: payload.isCorrect,
                timestamp: Date.now(),
                retryCount: 0,
            };

            const rawQueue = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
            const queue: OfflineStudyAnswer[] = rawQueue ? JSON.parse(rawQueue) : [];
            queue.push(answer);
            await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
        } catch (error) {
            console.error('[OfflineStorageService] Error queuing study answer:', error);
        }
    }

    /**
     * Çevrimdışı tamamlanan oturum için placeholder (ileride analytics genişletmesi için)
     */
    static async queueStudySessionComplete(_payload: {
        moduleId: string;
        totalAnswered: number;
        correctCount: number;
        durationSeconds: number;
    }): Promise<void> {
        // Oturum bazlı loglar zaten queueStudyAnswer ile tek tek kaydedildiği için
        // backend'e /mobile/study/log üzerinden iletildiğinde SM2 ve progress otomatik güncellenir.
    }

    /**
     * Kuyrukta bekleyen işlem sayısını döndürür
     */
    static async getPendingQueueCount(): Promise<number> {
        try {
            const rawQueue = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
            if (!rawQueue) return 0;
            const queue: OfflineStudyAnswer[] = JSON.parse(rawQueue);
            return queue.length;
        } catch {
            return 0;
        }
    }

    /**
     * İnternet bağlantısı geldiğinde bekleyen kuyruktaki cevapları
     * modül bazında gruplayıp gerçek bir sunucu oturumu oluşturarak /mobile/study/log'a gönderir
     */
    static async processSyncQueue(apiClient: any): Promise<{ synced: number; failed: number }> {
        try {
            const rawQueue = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
            if (!rawQueue) return { synced: 0, failed: 0 };

            const queue: OfflineStudyAnswer[] = JSON.parse(rawQueue);
            if (queue.length === 0) return { synced: 0, failed: 0 };

            // Modül ID'lerine göre cevapları grupla
            const groupedByModule: Record<string, OfflineStudyAnswer[]> = {};
            for (const item of queue) {
                if (!groupedByModule[item.moduleId]) {
                    groupedByModule[item.moduleId] = [];
                }
                groupedByModule[item.moduleId].push(item);
            }

            let syncedCount = 0;
            let failedCount = 0;
            const remainingQueue: OfflineStudyAnswer[] = [];

            for (const [moduleId, answers] of Object.entries(groupedByModule)) {
                try {
                    // 1. Backend'de gerçek bir LearningSession başlat
                    const sessionRes = await apiClient.post('/mobile/study/start', {
                        moduleId,
                        mode: 'NORMAL',
                    });
                    const realSessionId = sessionRes.data?.sessionId;

                    if (!realSessionId) {
                        throw new Error('Could not start remote session for sync');
                    }

                    // 2. Her bir cevabı backend /mobile/study/log endpoint'ine ilet
                    for (const ans of answers) {
                        try {
                            await apiClient.post('/mobile/study/log', {
                                sessionId: realSessionId,
                                itemId: ans.itemId,
                                quality: ans.quality,
                                durationMs: ans.durationMs,
                            });
                            syncedCount++;
                        } catch (err: any) {
                            console.warn('[OfflineStorageService] Error logging synced item:', ans.itemId, err?.message);
                            failedCount++;
                            if (ans.retryCount < 3) {
                                remainingQueue.push({ ...ans, retryCount: ans.retryCount + 1 });
                            }
                        }
                    }
                } catch (sessionErr: any) {
                    console.warn('[OfflineStorageService] Could not start session for module:', moduleId, sessionErr?.message);
                    failedCount += answers.length;
                    for (const ans of answers) {
                        if (ans.retryCount < 3) {
                            remainingQueue.push({ ...ans, retryCount: ans.retryCount + 1 });
                        }
                    }
                }
            }

            await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remainingQueue));
            return { synced: syncedCount, failed: failedCount };
        } catch (error) {
            console.error('[OfflineStorageService] Sync queue processing error:', error);
            return { synced: 0, failed: 0 };
        }
    }
}
