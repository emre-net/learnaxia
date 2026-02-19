import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export type StudyMode = 'NORMAL' | 'WRONG_ONLY' | 'SM2' | 'REVIEW' | 'QUIZ' | 'AI_SMART';

export interface StudyItem {
    id: string;
    moduleId: string;
    type: 'FLASHCARD' | 'MC' | 'GAP';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    selectedOption: string | null; // For Quiz
    feedback: 'CORRECT' | 'WRONG' | null; // For Quiz / Feedback state

    // Stats for this session
    correctCount: number;
    wrongCount: number;
    skipped: number;

    // Actions
    initSession: (moduleId: string, items: StudyItem[], mode: StudyMode, startIndex?: number) => void;
    setIsFlipped: (value: boolean) => void;
    setSelectedOption: (option: string | null) => void;
    setFeedback: (feedback: 'CORRECT' | 'WRONG' | null) => void;
    setCorrectCount: (count: number) => void;
    setWrongCount: (count: number) => void;
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
            selectedOption: null,
            feedback: null,

            correctCount: 0,
            wrongCount: 0,
            skipped: 0,

            initSession: (moduleId, items, mode, startIndex = 0) => {
                set({
                    sessionId: crypto.randomUUID(),
                    moduleId,
                    items,
                    mode,
                    currentIndex: startIndex,
                    startTime: new Date(),
                    isFlipped: false,
                    selectedOption: null,
                    feedback: null,
                    correctCount: startIndex, // Assume already solved are correct for stats? User didn't specify, but better than 0 if we want accuracy.
                    wrongCount: 0,
                    skipped: 0
                });
            },

            setIsFlipped: (value) => set({ isFlipped: value }),
            setSelectedOption: (option) => set({ selectedOption: option }),
            setFeedback: (feedback) => set({ feedback }),
            setCorrectCount: (count) => set({ correctCount: count }),
            setWrongCount: (count) => set({ wrongCount: count }),

            nextItem: () => {
                const { currentIndex, items } = get();
                // Allow going past the last item to trigger "completion" state
                if (currentIndex < items.length) {
                    set({
                        currentIndex: currentIndex + 1,
                        isFlipped: false,
                        selectedOption: null,
                        feedback: null
                    });
                }
            },

            endSession: () => {
                set({
                    sessionId: null,
                    moduleId: null,
                    items: [],
                    currentIndex: 0,
                    correctCount: 0,
                    wrongCount: 0,
                    selectedOption: null,
                    feedback: null
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
                correctCount: state.correctCount,
                wrongCount: state.wrongCount
                // Don't persist UI states like flipped/feedback across reloads necessarily, or do if needed.
            }),
        }
    )
);
