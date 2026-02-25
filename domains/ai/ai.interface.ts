
import { z } from "zod";

export interface AIResponseItem {
    type: 'FLASHCARD' | 'MC' | 'GAP' | 'TRUE_FALSE';
    content: any;
}

export interface VisionResult {
    questionText: string;
    solution: string;
    metadata?: Record<string, any>;
}

export interface AIProvider {
    name: string;
    generateContent(topic: string, types: string[], count: number): Promise<AIResponseItem[]>;
    analyzeImage(imageBuffer: Buffer, mimeType: string): Promise<VisionResult>;
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
