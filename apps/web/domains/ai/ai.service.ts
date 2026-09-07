
import { AIProvider, VisionResult, AIResponseItem, SyllabusItem } from "./ai.interface";
import { OpenAIAIProvider } from "./openai.provider";

export class AIService {
    private static _provider: AIProvider | null = null;

    private static getProvider(): AIProvider {
        if (!this._provider) {
            this._provider = new OpenAIAIProvider();
        }
        return this._provider;
    }

    static async generateContent(topic: string, types: string[], count: number, focusMode?: 'detailed' | 'summary' | 'key_concepts' | 'auto', language: string = 'tr'): Promise<AIResponseItem[]> {
        return this.getProvider().generateContent(topic, types, count, focusMode, language);
    }

    static async generateNote(topic: string, language: string = 'tr'): Promise<string> {
        return this.getProvider().generateNote(topic, language);
    }

    static async solvePhoto(imageBuffer: Buffer, mimeType: string, language: string = 'tr'): Promise<VisionResult> {
        return this.getProvider().analyzeImage(imageBuffer, mimeType, language);
    }

    static async generateSyllabus(topic: string, goal: string = "", depth: string = "standard", language: string = "tr", instruction: string = "", existingSyllabus: SyllabusItem[] = []): Promise<SyllabusItem[]> {
        return this.getProvider().generateSyllabus(topic, goal, depth, language, instruction, existingSyllabus);
    }

    static async validateTopic(topic: string, language: string = "tr"): Promise<{ isValid: boolean, reason?: string }> {
        return this.getProvider().validateTopic(topic, language);
    }
}
