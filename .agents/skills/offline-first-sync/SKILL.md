---
name: offline-first-sync
description: Explains how offline caching, local data persistence, and synchronization work across LearnAxia Mobile and Web. Use when implementing offline notes, cached modules, offline study sessions, or handling network disconnects.
triggers: [offline-notes, offline-cache, sync-data, network-disconnect]
---

# Offline-First Sync Architecture

## Purpose
Ensures that LearnAxia users can open their previously loaded notes, study modules, and collections even when they have NO active internet connection. When offline, local data remains accessible, online-only actions are clearly flagged, and queued changes sync when connection restores.

---

## 1. Local Storage Hierarchy

1. **Tokens & Credentials:** Stored in `expo-secure-store` (`learnaxia_access_token`, `learnaxia_refresh_token`).
2. **Metadata & Light Data:** Stored in `@react-native-async-storage/async-storage`:
   - `learnaxia_offline_notes`: List of user's notes with timestamps.
   - `learnaxia_offline_modules`: List of user's saved modules & card items.
   - `learnaxia_offline_collections`: List of collections.
   - `learnaxia_sync_queue`: Array of pending mutations (creates, edits, deletes).
3. **Heavy Attachments / Drawing Vectors:** Stored locally in filesystem (`FileSystem.documentDirectory`) or structured JSON in AsyncStorage.

---

## 2. Offline Reading Pattern

When loading modules or notes:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/lib/api';

export async function fetchWithOfflineFallback<T>(
    cacheKey: string,
    networkFetcher: () => Promise<T>
): Promise<{ data: T; isOffline: boolean }> {
    try {
        const remoteData = await networkFetcher();
        // Update local cache on successful fetch
        await AsyncStorage.setItem(cacheKey, JSON.stringify(remoteData));
        return { data: remoteData, isOffline: false };
    } catch (error) {
        // Fallback to local cache if network fails or user is offline
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
            return { data: JSON.parse(cached), isOffline: true };
        }
        throw error;
    }
}
```

---

## 3. UI/UX Rules for Offline State

1. **Persistent Offline Banner:**
   If running offline, display an amber/slate status pill at the top of the screen:
   > ⚠️ **Çevrimdışı Mod:** Daha önce kaydedilen içerikler gösteriliyor. Bu kısımlar çevrimdışı güncellenememektedir.

2. **Read-Only / Sync Queue Indication:**
   - Saved notes can be viewed and drafted locally.
   - If user edits a note offline, show badge: *"Cihazda Kaydedildi (İnternet bağlantısında senkronize edilecek)"*.
   - Disable actions that strictly require cloud LLMs (e.g., "AI ile Kart Üret", "Vision Soru Çöz"). Show a toast: *"Bu özellik aktif internet bağlantısı gerektirir"*.

---

## 4. Sync Queue Processing

When connectivity is restored:
1. Inspect `learnaxia_sync_queue`.
2. Process queued operations sequentially (FIFO) with idempotency keys.
3. Replace temporary local IDs with server-assigned UUIDs.
4. Clear synced items from the queue and notify user with a subtle success haptic/toast.
