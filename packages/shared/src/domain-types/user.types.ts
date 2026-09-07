export interface UserProfile {
    id: string;
    name: string | null;
    email: string | null;
    handle: string | null;
    image: string | null;
    language: string;
    role: string;
}

export interface LearningJourney {
    id: string;
    title: string;
    topic: string;
    depth: string;
    status: 'DRAFT' | 'GENERATING' | 'ACTIVE' | 'COMPLETED';
    slides?: LearningSlide[];
    createdAt: string;
}

export interface LearningSlide {
    id: string;
    order: number;
    title: string;
    content: string;
    peekingQuestion?: unknown;
}
