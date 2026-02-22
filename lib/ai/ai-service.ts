import OpenAI from "openai";
import { z } from "zod";

/**
 * Interface for AI Vision services to support multiple providers (OpenAI, Claude, etc.)
 */
export interface VisionAnalysisResult {
    questionText: string;
    solution: string;
    rawOutput?: string;
}

export interface VisionService {
    analyzeQuestionImage(imageBuffer: Buffer, mimeType: string): Promise<VisionAnalysisResult>;
}

/**
 * Error classes for specific edge cases as requested
 */
export class VisionError extends Error {
    constructor(public code: 'BLURRY' | 'NO_QUESTION' | 'MULTIPLE_QUESTIONS' | 'GENERAL', message: string) {
        super(message);
        this.name = 'VisionError';
    }
}

// Zod schema for structured output
const SolutionSchema = z.object({
    questionText: z.string().describe("The transcribed text of the question from the image"),
    solution: z.string().describe("The step-by-step solution to the question"),
    isQuestionPresent: z.boolean().describe("Whether a valid educational question was found in the image"),
    isReadable: z.boolean().describe("Whether the image is clear enough to read"),
    hasMultipleQuestions: z.boolean().describe("Whether multiple distinct questions were detected")
});

export class OpenAIVisionService implements VisionService {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    async analyzeQuestionImage(imageBuffer: Buffer, mimeType: string): Promise<VisionAnalysisResult> {
        if (!process.env.OPENAI_API_KEY) {
            console.warn("OPENAI_API_KEY missing, using mock vision analysis.");
            return this.getMockAnalysis();
        }

        const base64Image = imageBuffer.toString('base64');

        const systemPrompt = `
      You are an elite educational tutor specializing in solving questions from images.
      Your task:
      1. Transcribe the question text accurately.
      2. Provide a detailed, step-by-step solution.
      3. Evaluate image quality (is it readable?).
      4. Detect if there is a question at all.
      5. Detect if there are multiple questions.

      Respond ONLY in JSON format following this schema:
      {
        "questionText": "...",
        "solution": "...",
        "isQuestionPresent": true/false,
        "isReadable": true/false,
        "hasMultipleQuestions": true/false
      }
    `;

        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Please solve this question from the image." },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${mimeType};base64,${base64Image}`,
                                    detail: "high"
                                }
                            }
                        ],
                    },
                ],
                response_format: { type: "json_object" },
                max_tokens: 1500,
            });

            const content = JSON.parse(response.choices[0].message.content || "{}");
            const parsed = SolutionSchema.parse(content);

            // Edge case handling based on AI evaluation
            if (!parsed.isReadable) {
                throw new VisionError('BLURRY', 'Görüntü çok bulanık veya okunamaz durumda. Lütfen daha net bir fotoğraf çekin.');
            }
            if (!parsed.isQuestionPresent) {
                throw new VisionError('NO_QUESTION', 'Görüntüde bir soru tespit edilemedi. Lütfen bir soru fotoğrafı yükleyin.');
            }
            if (parsed.hasMultipleQuestions) {
                throw new VisionError('MULTIPLE_QUESTIONS', 'Birden fazla soru tespit edildi. Lütfen tek bir soruya odaklanarak tekrar deneyin.');
            }

            return {
                questionText: parsed.questionText,
                solution: parsed.solution,
                rawOutput: JSON.stringify(parsed)
            };
        } catch (error) {
            if (error instanceof VisionError) throw error;
            console.error("OpenAI Vision Analysis Error:", error);
            throw new Error("Soru çözülürken bir hata oluştu. Lütfen tekrar deneyin.");
        }
    }

    private getMockAnalysis(): VisionAnalysisResult {
        return {
            questionText: "Mock: Resimdeki sorunun metni buraya gelecek.",
            solution: "Mock: Adım adım çözüm buraya gelecek.\n1. Adım: ...\n2. Adım: ...",
        };
    }
}

// Lazy instance
let _aiVisionService: OpenAIVisionService | null = null;
export const aiVisionService = {
    analyzeQuestionImage: (imageBuffer: Buffer, mimeType: string) => {
        if (!_aiVisionService) _aiVisionService = new OpenAIVisionService();
        return _aiVisionService.analyzeQuestionImage(imageBuffer, mimeType);
    }
};
