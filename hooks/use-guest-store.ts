import { useLiveQuery } from "dexie-react-hooks";
import { db, GuestItemProgress, GuestLearningSession, GuestItemSession } from "@/lib/guest-db";

export function useGuestStore() {

    // --- Progress Methods ---

    const saveItemProgress = async (progress: GuestItemProgress) => {
        try {
            await db.guestProgress.put(progress);
        } catch (error) {
            console.error("Failed to save guest progress:", error);
        }
    };

    const getModuleProgress = async (moduleId: string) => {
        return await db.guestProgress.where("moduleId").equals(moduleId).toArray();
    };

    // --- Session Methods ---

    const startSession = async (session: GuestLearningSession) => {
        try {
            await db.guestSessions.add(session);
        } catch (error) {
            console.error("Failed to start guest session:", error);
        }
    };

    const completeSession = async (id: string, durationMs: number) => {
        try {
            await db.guestSessions.update(id, {
                completedAt: new Date(),
                durationMs: durationMs
            });
        } catch (error) {
            console.error("Failed to complete guest session:", error);
        }
    }

    const logItemSession = async (log: GuestItemSession) => {
        try {
            await db.guestItemSessions.add(log);
        } catch (error) {
            console.error("Failed to log guest item session:", error);
        }
    }

    // --- Data Access Hooks (Reactive) ---

    const useModuleStats = (moduleId: string) => {
        return useLiveQuery(async () => {
            const progress = await db.guestProgress.where("moduleId").equals(moduleId).toArray();
            const sessions = await db.guestSessions.where("moduleId").equals(moduleId).toArray();

            if (!progress) return { answered: 0, correct: 0, totalSessions: 0 };

            const answered = progress.length;
            const correct = progress.filter(p => p.correctCount > p.wrongCount).length; // Simple metric
            const totalSessions = sessions.length;

            return { answered, correct, totalSessions };
        }, [moduleId]);
    }

    return {
        saveItemProgress,
        getModuleProgress,
        startSession,
        completeSession,
        logItemSession,
        useModuleStats
    };
}
