import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StudyMode } from '@learnaxia/shared';

export type { StudyMode };

export interface StudyItem {
    id: string;
    moduleId: string;
    sessionId?: string;
    type: 'FLASHCARD' | 'MC' | 'GAP' | 'TRUE_FALSE';
    content: any;
    hash: string;
    box?: number;
    lastInterval?: number;
}

interface StudyState {
    sessionId: string | null;
    sessionMap: Record<string, string>;
    moduleId: string | null;
    mode: StudyMode;
    startTime: Date | null;
    isGuest: boolean;

    items: StudyItem[];
    currentIndex: number;

    isFlipped: boolean;
    selectedOption: string | null;
    feedback: 'CORRECT' | 'WRONG' | null;

    correctCount: number;
    wrongCount: number;
    skipped: number;

    initSession: (
        moduleId: string,
        items: StudyItem[],
        mode: StudyMode,
        startIndex?: number,
        sessionId?: string,
        isGuest?: boolean,
        sessionMap?: Record<string, string>
    ) => void;
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
            sessionMap: {},
            moduleId: null,
            mode: 'NORMAL',
            startTime: null,
            isGuest: false,
            items: [],
            currentIndex: 0,

            isFlipped: false,
            selectedOption: null,
            feedback: null,

            correctCount: 0,
            wrongCount: 0,
            skipped: 0,

            initSession: (moduleId, items, mode, startIndex = 0, sessionId, isGuest = false, sessionMap = {}) => {
                set({
                    sessionId: sessionId || crypto.randomUUID(),
                    sessionMap,
                    moduleId,
                    items,
                    mode,
                    isGuest,
                    currentIndex: startIndex,
                    startTime: new Date(),
                    isFlipped: false,
                    selectedOption: null,
                    feedback: null,
                    correctCount: 0,
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
                    sessionMap: {},
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
                sessionMap: state.sessionMap,
                moduleId: state.moduleId,
                mode: state.mode,
                startTime: state.startTime,
                items: state.items,
                currentIndex: state.currentIndex,
                correctCount: state.correctCount,
                wrongCount: state.wrongCount
            }),
        }
    )
);
