import { db } from "@/lib/guest-db";

/**
 * Synchronizes local guest study progress and sessions to the server
 * upon registration or login.
 */
export async function syncGuestDataToServer(): Promise<boolean> {
    if (typeof window === "undefined") return false;

    try {
        const [progress, sessions, itemSessions] = await Promise.all([
            db.guestProgress.toArray(),
            db.guestSessions.toArray(),
            db.guestItemSessions.toArray(),
        ]);

        if (progress.length === 0 && sessions.length === 0 && itemSessions.length === 0) {
            return false;
        }

        const formattedProgress = progress.map(p => ({
            itemId: p.itemId,
            moduleId: p.moduleId,
            contentHash: p.contentHash || "guest_hash",
            correctCount: p.correctCount,
            wrongCount: p.wrongCount,
            lastResult: p.lastResult,
            lastReviewedAt: (p.lastReviewedAt instanceof Date ? p.lastReviewedAt : new Date(p.lastReviewedAt)).toISOString(),
        }));

        const formattedSessions = sessions.map(s => ({
            id: s.id,
            moduleId: s.moduleId,
            startedAt: (s.startedAt instanceof Date ? s.startedAt : new Date(s.startedAt)).toISOString(),
            completedAt: s.completedAt ? (s.completedAt instanceof Date ? s.completedAt : new Date(s.completedAt)).toISOString() : undefined,
            durationMs: s.durationMs || 0,
            mode: s.mode || 'NORMAL',
        }));

        const formattedItemSessions = itemSessions.map(i => ({
            id: i.id,
            sessionId: i.sessionId,
            itemId: i.itemId,
            result: i.result,
            durationMs: i.durationMs || 0,
            createdAt: (i.createdAt instanceof Date ? i.createdAt : new Date(i.createdAt)).toISOString(),
        }));

        const res = await fetch("/api/auth/merge-guest-data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                guestData: {
                    progress: formattedProgress,
                    sessions: formattedSessions,
                    itemSessions: formattedItemSessions,
                }
            })
        });

        if (res.ok) {
            // Merged successfully - clear local guest data
            await Promise.all([
                db.guestProgress.clear(),
                db.guestSessions.clear(),
                db.guestItemSessions.clear(),
            ]);
            return true;
        }
    } catch (error) {
        console.warn("Guest data sync error:", error);
    }
    return false;
}
