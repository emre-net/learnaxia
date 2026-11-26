import AsyncStorage from '@react-native-async-storage/async-storage';

const MODULE_CACHE_PREFIX = 'learnaxia_module_';
const MODULE_INDEX_KEY = 'learnaxia_offline_module_index';
const NOTE_CACHE_PREFIX = 'learnaxia_note_';
const NOTE_INDEX_KEY = 'learnaxia_offline_note_index';
const SYNC_QUEUE_KEY = 'learnaxia_offline_sync_queue';
const DEAD_LETTER_KEY = 'learnaxia_offline_dead_letter';

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

export interface OfflineSessionSummary {
    id: string;
    moduleId: string;
    totalAnswered: number;
    correctCount: number;
    durationSeconds: number;
    timestamp: number;
}

export class OfflineStorageService {
    private static writeLock: Promise<void> = Promise.resolve();

    /**
     * Async write mutex serializing read-modify-write AsyncStorage operations.
     */
    private static async withLock<T>(op: () => Promise<T>): Promise<T> {
        let release!: () => void;
        const nextLock = new Promise<void>((resolve) => {
            release = resolve;
        });
        const prevLock = this.writeLock;
        this.writeLock = nextLock;
        await prevLock.catch(() => {});
        try {
            return await op();
        } finally {
            release();
        }
    }

    /**
     * Bir modülü çevrimdışı kullanım için yerel önbelleğe kaydeder
     */
    static async cacheModule(moduleData: any): Promise<void> {
        if (!moduleData?.id) return;
        return this.withLock(async () => {
            try {
                const key = `${MODULE_CACHE_PREFIX}${moduleData.id}`;
                await AsyncStorage.setItem(key, JSON.stringify(moduleData));

                const rawIndex = await AsyncStorage.getItem(MODULE_INDEX_KEY);
                const index: string[] = rawIndex ? JSON.parse(rawIndex) : [];
                if (!index.includes(moduleData.id)) {
                    index.push(moduleData.id);
                    await AsyncStorage.setItem(MODULE_INDEX_KEY, JSON.stringify(index));
                }
            } catch (error) {
                console.error('[OfflineStorageService] Error caching module:', error);
            }
        });
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
     * Çevrimdışı notları yerel önbelleğe kaydeder
     */
    static async cacheNotes(notes: any[]): Promise<void> {
        if (!Array.isArray(notes)) return;
        return this.withLock(async () => {
            try {
                const index: string[] = [];
                for (const note of notes) {
                    if (!note?.id) continue;
                    index.push(note.id);
                    await AsyncStorage.setItem(`${NOTE_CACHE_PREFIX}${note.id}`, JSON.stringify(note));
                }
                await AsyncStorage.setItem(NOTE_INDEX_KEY, JSON.stringify(index));
            } catch (error) {
                console.error('[OfflineStorageService] Error caching notes:', error);
            }
        });
    }

    static async getCachedNotes(): Promise<any[]> {
        try {
            const rawIndex = await AsyncStorage.getItem(NOTE_INDEX_KEY);
            const index: string[] = rawIndex ? JSON.parse(rawIndex) : [];
            const notes = [];
            for (const id of index) {
                const raw = await AsyncStorage.getItem(`${NOTE_CACHE_PREFIX}${id}`);
                if (raw) notes.push(JSON.parse(raw));
            }
            return notes;
        } catch {
            return [];
        }
    }

    static async getCachedNote(noteId: string): Promise<any | null> {
        try {
            const raw = await AsyncStorage.getItem(`${NOTE_CACHE_PREFIX}${noteId}`);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
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
        return this.withLock(async () => {
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
        });
    }

    /**
     * Çevrimdışı tamamlanan oturum özetini güvenli şekilde kaydeder (dead-letter / analytics izlenebilirliği)
     */
    static async queueStudySessionComplete(payload: {
        moduleId: string;
        totalAnswered: number;
        correctCount: number;
        durationSeconds: number;
    }): Promise<void> {
        return this.withLock(async () => {
            try {
                const key = 'learnaxia_offline_completed_sessions';
                const raw = await AsyncStorage.getItem(key);
                const list: OfflineSessionSummary[] = raw ? JSON.parse(raw) : [];
                list.push({
                    id: `sess_${Date.now()}`,
                    ...payload,
                    timestamp: Date.now(),
                });
                await AsyncStorage.setItem(key, JSON.stringify(list.slice(-50)));
            } catch (error) {
                console.error('[OfflineStorageService] Error saving offline session summary:', error);
            }
        });
    }

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

    static async getDeadLetterCount(): Promise<number> {
        try {
            const raw = await AsyncStorage.getItem(DEAD_LETTER_KEY);
            if (!raw) return 0;
            const list: OfflineStudyAnswer[] = JSON.parse(raw);
            return list.length;
        } catch {
            return 0;
        }
    }

    static async retryDeadLetters(): Promise<void> {
        return this.withLock(async () => {
            try {
                const rawDead = await AsyncStorage.getItem(DEAD_LETTER_KEY);
                if (!rawDead) return;
                const dead: OfflineStudyAnswer[] = JSON.parse(rawDead);
                if (dead.length === 0) return;

                const rawQueue = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
                const queue: OfflineStudyAnswer[] = rawQueue ? JSON.parse(rawQueue) : [];
                const resetDead = dead.map((d) => ({ ...d, retryCount: 0 }));
                await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify([...queue, ...resetDead]));
                await AsyncStorage.removeItem(DEAD_LETTER_KEY);
            } catch (error) {
                console.error('[OfflineStorageService] Error retrying dead letters:', error);
            }
        });
    }

    /**
     * Logout veya oturum değişiminde kullanıcıya ait tüm çevrimdışı veriyi temizler
     */
    static async clearAllUserData(): Promise<void> {
        return this.withLock(async () => {
            try {
                const allKeys = await AsyncStorage.getAllKeys();
                const userKeys = allKeys.filter(
                    (k) =>
                        k.startsWith(MODULE_CACHE_PREFIX) ||
                        k.startsWith(NOTE_CACHE_PREFIX) ||
                        k.startsWith('learnaxia_offline_')
                );
                if (userKeys.length > 0) {
                    await AsyncStorage.multiRemove(userKeys);
                }
            } catch (error) {
                console.error('[OfflineStorageService] Error clearing user cache:', error);
            }
        });
    }

    /**
     * İnternet bağlantısı geldiğinde bekleyen kuyruktaki cevapları
     * modül bazında gruplayıp gerçek bir sunucu oturumu oluşturarak /mobile/study/log'a gönderir
     */
    static async processSyncQueue(apiClient: any): Promise<{ synced: number; failed: number; deadLettered: number }> {
        return this.withLock(async () => {
            try {
                const rawQueue = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
                if (!rawQueue) return { synced: 0, failed: 0, deadLettered: 0 };

                const queue: OfflineStudyAnswer[] = JSON.parse(rawQueue);
                if (queue.length === 0) return { synced: 0, failed: 0, deadLettered: 0 };

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
                const rawDead = await AsyncStorage.getItem(DEAD_LETTER_KEY);
                const deadLetters: OfflineStudyAnswer[] = rawDead ? JSON.parse(rawDead) : [];
                let newDeadCount = 0;

                const pushFailure = (ans: OfflineStudyAnswer, status?: number) => {
                    failedCount++;
                    const isPermanentClientError = status === 400 || status === 403 || status === 404;
                    if (isPermanentClientError || ans.retryCount >= 5) {
                        deadLetters.push({ ...ans, retryCount: ans.retryCount + 1 });
                        newDeadCount++;
                    } else {
                        remainingQueue.push({ ...ans, retryCount: ans.retryCount + 1 });
                    }
                };

                for (const [moduleId, answers] of Object.entries(groupedByModule)) {
                    try {
                        const sessionRes = await apiClient.post('/mobile/study/start', {
                            moduleId,
                            mode: 'NORMAL',
                        });
                        const realSessionId = sessionRes.data?.sessionId;
                        if (!realSessionId) {
                            throw new Error('Could not start remote session for sync');
                        }

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
                                pushFailure(ans, err?.response?.status);
                            }
                        }
                    } catch (sessionErr: any) {
                        console.warn('[OfflineStorageService] Could not start session for module:', moduleId, sessionErr?.message);
                        const status = sessionErr?.response?.status;
                        for (const ans of answers) {
                            pushFailure(ans, status);
                        }
                    }
                }

                await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remainingQueue));
                if (deadLetters.length > 0) {
                    await AsyncStorage.setItem(DEAD_LETTER_KEY, JSON.stringify(deadLetters.slice(-100)));
                }
                return { synced: syncedCount, failed: failedCount, deadLettered: newDeadCount };
            } catch (error) {
                console.error('[OfflineStorageService] Sync queue processing error:', error);
                return { synced: 0, failed: 0, deadLettered: 0 };
            }
        });
    }
}
