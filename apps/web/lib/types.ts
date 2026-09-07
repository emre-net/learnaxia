
export type ItemType = 'FLASHCARD' | 'MC' | 'GAP' | 'TRUE_FALSE';

export type StudyMode = 'NORMAL' | 'WRONG_ONLY' | 'SM2' | 'REVIEW' | 'QUIZ' | 'AI_SMART';

export interface BaseItemContent {
    question?: string;
    answer?: string;
    solution?: string;
}

export interface FlashcardContent extends BaseItemContent {
    front: string;
    back: string;
}

export interface QuizContent extends BaseItemContent {
    options: string[];
}

export interface GapFillContent extends BaseItemContent {
    text: string;
    answers: string[];
}
