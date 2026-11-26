import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineStorageService } from '../../services/offline-storage.service';

const mockStore = new Map<string, string>();
const delay = () => new Promise<void>((resolve) => setTimeout(resolve, 2));

jest.mock('@react-native-async-storage/async-storage', () => ({
    __esModule: true,
    default: {
        getItem: jest.fn(async (key: string) => {
            await delay();
            return mockStore.get(key) ?? null;
        }),
        setItem: jest.fn(async (key: string, value: string) => {
            await delay();
            mockStore.set(key, value);
        }),
        removeItem: jest.fn(async (key: string) => {
            await delay();
            mockStore.delete(key);
        }),
        getAllKeys: jest.fn(async () => Array.from(mockStore.keys())),
        multiRemove: jest.fn(async (keys: string[]) => {
            for (const key of keys) {
                mockStore.delete(key);
            }
        }),
    },
}));

describe('OfflineStorageService Unit Tests', () => {
    beforeEach(() => {
        mockStore.clear();
        jest.clearAllMocks();
    });

    it('serializes concurrent queueStudyAnswer calls without lost writes via withLock', async () => {
        await Promise.all(
            Array.from({ length: 8 }, (_, idx) =>
                OfflineStorageService.queueStudyAnswer({
                    moduleId: 'mod-1',
                    itemId: `item-${idx}`,
                    quality: 4,
                    durationMs: 1200,
                    isCorrect: true,
                })
            )
        );

        const count = await OfflineStorageService.getPendingQueueCount();
        expect(count).toBe(8);
    });

    it('caches and retrieves offline notes cleanly', async () => {
        await OfflineStorageService.cacheNotes([
            { id: 'note-1', title: 'Kimya', content: 'Asitler ve Bazlar' },
            { id: 'note-2', title: 'Tarih', content: 'Cumhuriyet' },
        ]);

        const notes = await OfflineStorageService.getCachedNotes();
        expect(notes).toHaveLength(2);
        const single = await OfflineStorageService.getCachedNote('note-1');
        expect(single?.title).toBe('Kimya');
    });

    it('moves permanent client errors (400/403/404) or max-retried items to dead-letter queue and supports retryDeadLetters', async () => {
        await OfflineStorageService.queueStudyAnswer({
            moduleId: 'mod-bad',
            itemId: 'item-bad',
            quality: 4,
            durationMs: 900,
            isCorrect: true,
        });

        const fakeApi = {
            post: jest.fn().mockRejectedValue({
                message: 'Not found',
                response: { status: 404 },
            }),
        };

        const result = await OfflineStorageService.processSyncQueue(fakeApi);
        expect(result.deadLettered).toBe(1);
        expect(await OfflineStorageService.getPendingQueueCount()).toBe(0);
        expect(await OfflineStorageService.getDeadLetterCount()).toBe(1);

        await OfflineStorageService.retryDeadLetters();
        expect(await OfflineStorageService.getDeadLetterCount()).toBe(0);
        expect(await OfflineStorageService.getPendingQueueCount()).toBe(1);
    });

    it('groups queued answers by moduleId and syncs via /mobile/study/start and /mobile/study/log', async () => {
        await OfflineStorageService.queueStudyAnswer({
            moduleId: 'mod-a',
            itemId: 'item-1',
            quality: 4,
            durationMs: 800,
            isCorrect: true,
        });
        await OfflineStorageService.queueStudyAnswer({
            moduleId: 'mod-a',
            itemId: 'item-2',
            quality: 1,
            durationMs: 1100,
            isCorrect: false,
        });

        const fakeApi = {
            post: jest.fn(async (url: string) => {
                if (url === '/mobile/study/start') {
                    return { data: { sessionId: 'sess-real-1' } };
                }
                return { data: { ok: true } };
            }),
        };

        const res = await OfflineStorageService.processSyncQueue(fakeApi);
        expect(res).toEqual({ synced: 2, failed: 0, deadLettered: 0 });
        expect(fakeApi.post).toHaveBeenCalledWith('/mobile/study/start', { moduleId: 'mod-a', mode: 'NORMAL' });
        expect(fakeApi.post).toHaveBeenCalledWith('/mobile/study/log', {
            sessionId: 'sess-real-1',
            itemId: 'item-1',
            quality: 4,
            durationMs: 800,
        });
        expect(await OfflineStorageService.getPendingQueueCount()).toBe(0);
    });

    it('clears all user offline caches on clearAllUserData while preserving non-user keys', async () => {
        mockStore.set('learnaxia_app_language', 'tr');
        await OfflineStorageService.cacheModule({ id: 'm1', title: 'Test' });
        await OfflineStorageService.cacheNotes([{ id: 'n1', title: 'Not' }]);
        await OfflineStorageService.queueStudyAnswer({
            moduleId: 'm1',
            itemId: 'i1',
            quality: 5,
            durationMs: 500,
            isCorrect: true,
        });

        await OfflineStorageService.clearAllUserData();

        expect(AsyncStorage.multiRemove).toHaveBeenCalled();
        expect(await OfflineStorageService.getAllCachedModules()).toEqual([]);
        expect(await OfflineStorageService.getCachedNotes()).toEqual([]);
        expect(await OfflineStorageService.getPendingQueueCount()).toBe(0);
        expect(mockStore.get('learnaxia_app_language')).toBe('tr');
    });
});
