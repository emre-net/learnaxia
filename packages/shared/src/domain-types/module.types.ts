export type ModuleType = 'FLASHCARD' | 'MC' | 'TRUE_FALSE' | 'GAP' | 'NOTE' | 'QUIZ';

export interface ModuleItemContent {
    // Flashcard
    front?: string;
    back?: string;
    // MC (Multiple Choice)
    question?: string;
    answer?: string;
    options?: string[];
    correctAnswer?: string;
    explanation?: string;
    // GAP (Fill in the blank)
    text?: string;      // "The {{capital}} of France is {{Paris}}."
    answers?: string[];  // ["capital", "Paris"]
    // TRUE_FALSE
    statement?: string;
    // Generic
    content?: string;
}

export interface ModuleItem {
    id: string;
    type: ModuleType | string;
    order: number;
    content: ModuleItemContent;
}

export interface StudyModule {
    id: string;
    title: string;
    items: ModuleItem[];
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface UserModule {
    id: string;
    title: string;
    description?: string;
    itemCount: number;
    type: 'FLASHCARD' | 'MIXED';
}
