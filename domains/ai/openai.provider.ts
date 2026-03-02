import OpenAI from "openai";
import { AIProvider, AIResponseItem, VisionResult, AIError } from "./ai.interface";
import { z } from "zod";
import prisma from "@/lib/prisma";

const GenerationSchema = z.object({
    items: z.array(z.any()),
});

const EvaluationSchema = z.object({
    isValid: z.boolean(),
    feedback: z.string().optional()
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
        this.client = new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: "https://api.groq.com/openai/v1"
        });
    }

    async generateContent(topic: string, types: string[], count: number, focusMode?: 'detailed' | 'summary' | 'key_concepts' | 'auto'): Promise<AIResponseItem[]> {
        if (!process.env.GROQ_API_KEY) {
            throw new AIError('AUTH_ERROR', 'Groq API key is missing. Please add GROQ_API_KEY to your env.');
        }

        const isExtraction = topic.length > 200;
        const countInstruction = count === -1
            ? "Determine the optimal number of items to generate based on the density of the provided text (minimum 3, maximum 30)."
            : `Generate exactly ${count} study items.`;

        let focusInstruction = "Extract content evenly and comprehensively across the provided text.";
        if (focusMode === 'detailed') {
            focusInstruction = "Perform a deep, granular extraction. Focus on very specific details, intricate facts, and subtle nuances described in the text.";
        } else if (focusMode === 'key_concepts') {
            focusInstruction = "Focus heavily on the most emphasized, bolded, or repeated core concepts. Ignore minor details and prioritize major themes and definitions.";
        } else if (focusMode === 'summary') {
            focusInstruction = "Provide a high-level summary extraction. Focus on the overarching narrative and broad takeaways rather than specific data points.";
        } else if (focusMode === 'auto') {
            focusInstruction = "Autonomously determine the best extraction strategy based on the tone and structure of the provided text.";
        }

        const baseSystemPrompt = `
            You are an expert educational content generator.
            ${isExtraction
                ? 'Your task is to EXTRACT key concepts from the following user notes/documents and turn them into study items.'
                : 'Your task is to GENERATE study items about the following topic.'}
            
            Extraction Focus / Strategy: 
            ${focusInstruction}

            Instruction: ${countInstruction}
            Types to generate: ${types.join(", ")}.
            
            Return JSON in this format:
            {
                "items": [
                    { "type": "TYPE", "content": { ... }, "sourceContext": "optional short quote/concept source" }
                ]
            }
        `;

        let currentItems: AIResponseItem[] = [];
        let feedback = "";
        const MAX_RETRIES = 1;
        const generationId = crypto.randomUUID();

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            const systemPrompt = feedback
                ? `${baseSystemPrompt}\n\nPREVIOUS ATTEMPT FEEDBACK: The previous generation had issues. Please fix them. Feedback: ${feedback}`
                : baseSystemPrompt;

            try {
                // 1. Generator AI
                const response = await this.client.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: isExtraction ? `Extract from this content:\n\n${topic}` : `Generate content for topic: ${topic}` }
                    ],
                    response_format: { type: "json_object" }
                });

                const contentString = response.choices[0].message.content || "{}";
                let content;
                let parsed;

                try {
                    content = JSON.parse(contentString);
                    parsed = GenerationSchema.parse(content);
                } catch (parseError: any) {
                    await prisma.systemLog.create({
                        data: {
                            requestId: generationId,
                            level: "ERROR",
                            environment: process.env.NODE_ENV || "development",
                            service: "ai",
                            message: `JSON Parsing veya Schema Doğrulama Hatası (Attempt ${attempt})`,
                            source: "SERVER",
                            metadata: {
                                attempt,
                                rawResponse: contentString,
                                error: parseError.message
                            }
                        }
                    }).catch(() => { });
                    throw parseError; // Caught by outer catch block
                }

                currentItems = parsed.items as AIResponseItem[];

                // If this is the last attempt, return the items immediately to avoid a redundant check
                if (attempt === MAX_RETRIES) {
                    console.log(`[Checker AI] Max retries reached. Returning generated items.`);
                    break;
                }

                // 2. Evaluator (Checker) AI
                const evaluatorPrompt = `
                    You are an elite educational content reviewer (Checker AI).
                    Your job is to review the generated study items against the user's original ${isExtraction ? 'source text' : 'topic'}.
                    
                    Original Input:
                    ${topic}

                    Requirements:
                    1. Items must be directly relevant and factually accurate based on the original input.
                    2. Count constraints must be met (Instruction: ${countInstruction}).
                    3. Types requested must be honored (${types.join(", ")}).
                    
                    Respond ONLY in JSON format:
                    {
                        "isValid": boolean,
                        "feedback": "string, leave empty if true. if false, clearly list mistakes and precise instructions on what to change."
                    }
                `;

                const evalResponse = await this.client.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: evaluatorPrompt },
                        { role: "user", content: `Review these generated items:\n\n${JSON.stringify(currentItems, null, 2)}` }
                    ],
                    response_format: { type: "json_object" }
                });

                let evalParsed;
                try {
                    const evalContent = JSON.parse(evalResponse.choices[0].message.content || "{}");
                    evalParsed = EvaluationSchema.parse(evalContent);
                } catch (e: any) {
                    console.warn(`[Checker AI] Malfunctioned or output invalid JSON on attempt ${attempt}. Forcing retry.`);
                    evalParsed = { isValid: false, feedback: "The evaluation system could not process your output. Please ensure strict JSON compliance and factual accuracy." };
                }

                // Log Interaction to Database
                await prisma.systemLog.create({
                    data: {
                        requestId: generationId,
                        level: evalParsed.isValid ? "INFO" : "WARN",
                        environment: process.env.NODE_ENV || "development",
                        service: "ai",
                        message: evalParsed.isValid
                            ? `AI Generation Loop Completed Successfully (Attempt ${attempt})`
                            : `Checker AI Requested Adjustments (Attempt ${attempt})`,
                        source: "SERVER",
                        metadata: {
                            attempt,
                            isExtraction,
                            generatorInput: topic,
                            generatorSystemPrompt: systemPrompt,
                            generatorOutput: currentItems as any,
                            checkerFeedback: evalParsed.feedback || "Valid"
                        }
                    }
                }).catch((e: any) => console.error("AI Logging Failed:", e));

                if (evalParsed.isValid) {
                    console.log(`[Checker AI] Content approved on attempt ${attempt}.`);
                    break;
                } else {
                    console.log(`[Checker AI] Content rejected on attempt ${attempt}. Feedback:`, evalParsed.feedback);
                    feedback = evalParsed.feedback || "Generated items did not meet quality standards. Completely rewrite them.";
                }

            } catch (error: any) {
                console.error(`OpenAI Generation Error (Attempt ${attempt}):`, error);

                await prisma.systemLog.create({
                    data: {
                        requestId: generationId,
                        level: "ERROR",
                        environment: process.env.NODE_ENV || "development",
                        service: "ai",
                        message: `Generator Loop Crashed (Attempt ${attempt})`,
                        source: "SERVER",
                        stack: error.stack,
                        metadata: { attempt, errorMessage: error.message }
                    }
                }).catch(() => { });

                if (attempt === MAX_RETRIES) {
                    throw new AIError('UNKNOWN', error.message || 'AI generation failed after retries');
                }
                feedback = `Previous generation failed with error: ${error.message}. Please generate valid JSON.`;
            }
        }

        return currentItems;
    }

    async analyzeImage(imageBuffer: Buffer, mimeType: string): Promise<VisionResult> {
        if (!process.env.GROQ_API_KEY) {
            throw new AIError('AUTH_ERROR', 'Groq API key is missing. Please add GROQ_API_KEY to your env.');
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
