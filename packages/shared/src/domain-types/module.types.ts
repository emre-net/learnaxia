export type ModuleType = 'FLASHCARD' | 'NOTE' | 'QUIZ';

export interface ModuleItemContent {
    question?: string;
    answer?: string;
    options?: string[];
    correctAnswer?: string;
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
