
import { AIProvider, VisionResult, AIResponseItem } from "./ai.interface";
import { OpenAIAIProvider } from "./openai.provider";

export class AIService {
    private static _provider: AIProvider | null = null;

    private static getProvider(): AIProvider {
        if (!this._provider) {
            this._provider = new OpenAIAIProvider();
        }
        return this._provider;
    }

    static async generateContent(topic: string, types: string[], count: number): Promise<AIResponseItem[]> {
        return this.getProvider().generateContent(topic, types, count);
    }

    static async solvePhoto(imageBuffer: Buffer, mimeType: string): Promise<VisionResult> {
        return this.getProvider().analyzeImage(imageBuffer, mimeType);
    }
}
