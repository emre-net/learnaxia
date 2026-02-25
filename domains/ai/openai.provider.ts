
import OpenAI from "openai";
import { AIProvider, AIResponseItem, VisionResult, AIError } from "./ai.interface";
import { z } from "zod";

const GenerationSchema = z.object({
    items: z.array(z.any()),
});

const VisionSchema = z.object({
    questionText: z.string(),
    solution: z.string(),
    isQuestionPresent: z.boolean(),
    isReadable: z.boolean(),
    hasMultipleQuestions: z.boolean()
});

export class OpenAIAIProvider implements AIProvider {
    name = "OpenAI";
    private client: OpenAI;

    constructor() {
        this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    async generateContent(topic: string, types: string[], count: number): Promise<AIResponseItem[]> {
        if (!process.env.OPENAI_API_KEY) {
            throw new AIError('AUTH_ERROR', 'OpenAI API key is missing');
        }

        const systemPrompt = `
            You are an expert educational content generator.
            Generate ${count} study items about "${topic}".
            Types to generate: ${types.join(", ")}.
            
            Return JSON in this format:
            {
                "items": [
                    { "type": "TYPE", "content": { ... } }
                ]
            }
        `;

        try {
            const response = await this.client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Generate content for topic: ${topic}` }
                ],
                response_format: { type: "json_object" }
            });

            const content = JSON.parse(response.choices[0].message.content || "{}");
            const parsed = GenerationSchema.parse(content);

            return parsed.items as AIResponseItem[];
        } catch (error: any) {
            console.error("OpenAI Generation Error:", error);
            throw new AIError('UNKNOWN', error.message || 'AI generation failed');
        }
    }

    async analyzeImage(imageBuffer: Buffer, mimeType: string): Promise<VisionResult> {
        if (!process.env.OPENAI_API_KEY) {
            throw new AIError('AUTH_ERROR', 'OpenAI API key is missing');
        }

        const base64Image = imageBuffer.toString('base64');

        const systemPrompt = `
            You are an elite educational tutor. Analyze the image and provide the question text and solution.
            Respond ONLY in JSON format:
            {
                "questionText": "...",
                "solution": "...",
                "isQuestionPresent": true/false,
                "isReadable": true/false,
                "hasMultipleQuestions": true/false
            }
        `;

        try {
            const response = await this.client.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Analyze and solve the question in this image." },
                            {
                                type: "image_url",
                                image_url: { url: `data:${mimeType};base64,${base64Image}`, detail: "high" }
                            }
                        ]
                    }
                ],
                response_format: { type: "json_object" }
            });

            const content = JSON.parse(response.choices[0].message.content || "{}");
            const parsed = VisionSchema.parse(content);

            if (!parsed.isReadable) throw new AIError('VISION_FAILED', 'Image is not readable');
            if (!parsed.isQuestionPresent) throw new AIError('VISION_FAILED', 'No question found in image');

            return {
                questionText: parsed.questionText,
                solution: parsed.solution,
                metadata: { hasMultipleQuestions: parsed.hasMultipleQuestions }
            };
        } catch (error: any) {
            if (error instanceof AIError) throw error;
            console.error("OpenAI Vision Error:", error);
            throw new AIError('UNKNOWN', error.message || 'Vision analysis failed');
        }
    }
}
