
import { z } from "zod";

export interface AIResponseItem {
    type: 'FLASHCARD' | 'MC' | 'GAP' | 'TRUE_FALSE';
    content: any;
}

export interface SyllabusItem {
    order: number;
    title: string;
    overview: string;
    estimatedMinutes: number;
}

export interface VisionResult {
    questionText: string;
    solution: string;
    metadata?: Record<string, any>;
}

export interface AIProvider {
    name: string;
    generateContent(topic: string, types: string[], count: number, focusMode?: 'detailed' | 'summary' | 'key_concepts' | 'auto', language?: string): Promise<AIResponseItem[]>;
    generateNote(topic: string, language?: string): Promise<string>;
    analyzeImage(imageBuffer: Buffer, mimeType: string, language?: string): Promise<VisionResult>;
    generateSyllabus(topic: string, goal?: string, depth?: string, language?: string, instruction?: string, existingSyllabus?: SyllabusItem[]): Promise<SyllabusItem[]>;
    validateTopic(topic: string, language?: string): Promise<{ isValid: boolean, reason?: string }>;
}

export class AIError extends Error {
    constructor(
        public code: 'AUTH_ERROR' | 'RATE_LIMIT' | 'INVALID_INPUT' | 'VISION_FAILED' | 'UNKNOWN',
        message: string,
        public details?: any
    ) {
        super(message);
        this.name = 'AIError';
    }
}
