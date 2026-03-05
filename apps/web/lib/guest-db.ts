import Dexie, { Table } from 'dexie';

// --- Interfaces mirroring the Prisma schema but for local storage ---

export interface GuestItemProgress {
    itemId: string;
    moduleId: string;
    contentHash: string; // To detect changes if user merges later
    correctCount: number;
    wrongCount: number;
    lastResult: 'CORRECT' | 'WRONG' | 'HINT' | 'SKIP' | null;
    lastReviewedAt: Date;
    // SM-2 params are NOT stored for guests usually, but we can store them if we want full fidelity
    // For now, keeping it simple as per plan
}

export interface GuestLearningSession {
    id: string; // UUID
    moduleId: string;
    startedAt: Date;
    completedAt?: Date;
    durationMs: number;
    mode: 'NORMAL' | 'REVIEW' | 'WRONG_ONLY' | 'SM2';
}

export interface GuestItemSession {
    id: string;
    sessionId: string;
    itemId: string;
    result: string;
    durationMs: number;
    createdAt: Date;
}

export class GuestDatabase extends Dexie {
    guestProgress!: Table<GuestItemProgress, string>; // Primary key: itemId
    guestSessions!: Table<GuestLearningSession, string>; // Primary key: id
    guestItemSessions!: Table<GuestItemSession, string>; // Primary key: id

    constructor() {
        super('LearnaxiaGuestDB');

        // Define tables and indexes
        this.version(1).stores({
            guestProgress: 'itemId, moduleId, lastReviewedAt', // Indexes
            guestSessions: 'id, moduleId, startedAt',
            guestItemSessions: 'id, sessionId, itemId'
        });
    }
}

export const db = new GuestDatabase();
