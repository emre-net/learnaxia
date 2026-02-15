import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export type StudyMode = 'NORMAL' | 'WRONG_ONLY' | 'SM2' | 'REVIEW';

export interface StudyItem {
    id: string;
    moduleId: string;
    type: 'FLASHCARD' | 'MC' | 'GAP';
    content: any; // JSONB content
    hash: string;
    // Progress snapshot
    box?: number; // 0-5 for SM2
    lastInterval?: number;
}

interface StudyState {
    // Session Config
    sessionId: string | null;
    moduleId: string | null;
    mode: StudyMode;
    startTime: Date | null;

    // Data
    items: StudyItem[];
    currentIndex: number;

    // Runtime State
    isFlipped: boolean; // For flashcards
    currentAnswer: any | null; // For MC/GAP input
    isChecked: boolean; // Have we shown the result?

    // Stats for this session
    results: {
        correct: number;
        wrong: number;
        skipped: number;
    };

    // Actions
    initSession: (moduleId: string, items: StudyItem[], mode: StudyMode) => void;
    flipCard: () => void;
    setAnswer: (answer: any) => void;
    checkAnswer: () => void;
    nextItem: () => void;
    endSession: () => void;
}

export const useStudyStore = create<StudyState>()(
    persist(
        (set, get) => ({
            sessionId: null,
            moduleId: null,
            mode: 'NORMAL',
            startTime: null,
            items: [],
            currentIndex: 0,

            isFlipped: false,
            currentAnswer: null,
            isChecked: false,

            results: { correct: 0, wrong: 0, skipped: 0 },

            initSession: (moduleId, items, mode) => {
                set({
                    sessionId: crypto.randomUUID(),
                    moduleId,
                    items,
                    mode,
                    currentIndex: 0,
                    startTime: new Date(),
                    isFlipped: false,
                    currentAnswer: null,
                    isChecked: false,
                    results: { correct: 0, wrong: 0, skipped: 0 }
                });
            },

            flipCard: () => set((state) => ({ isFlipped: !state.isFlipped })),

            setAnswer: (answer) => set({ currentAnswer: answer }),

            checkAnswer: () => {
                set({ isChecked: true });
            },

            nextItem: () => {
                const { currentIndex, items } = get();
                if (currentIndex < items.length - 1) {
                    set({
                        currentIndex: currentIndex + 1,
                        isFlipped: false,
                        isChecked: false,
                        currentAnswer: null
                    });
                }
            },

            endSession: () => {
                set({
                    sessionId: null,
                    moduleId: null,
                    items: [],
                    currentIndex: 0
                });
            }
        }),
        {
            name: 'study-store',
            partialize: (state) => ({
                sessionId: state.sessionId,
                moduleId: state.moduleId,
                mode: state.mode,
                startTime: state.startTime,
                items: state.items,
                currentIndex: state.currentIndex,
                results: state.results,
            }),
        }
    )
);
