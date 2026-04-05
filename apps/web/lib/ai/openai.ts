import OpenAI from "openai";
import { z } from "zod";
import { GenerationSchema } from "@learnaxia/shared";

/**
 * Robust JSON extraction for LLM responses that might include markdown or conversational text.
 */
export function safeJsonParse<T>(text: string, schema: z.ZodSchema<T>): T {
    try {
        // Try direct parse first
        return schema.parse(JSON.parse(text));
    } catch {
        // Try extracting from markdown code blocks
        const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
            try {
                return schema.parse(JSON.parse(match[1]));
            } catch {
                // Ignore and try loose extraction
            }
        }

        // Try finding the first '{' and last '}'
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
            try {
                return schema.parse(JSON.parse(text.substring(start, end + 1)));
            } catch {
                // Ignore
            }
        }
        throw new Error("Could not parse AI response as valid JSON.");
    }
}

let _groq: OpenAI | null = null;
function getGroq() {
    if (!_groq) {
        _groq = new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: "https://api.groq.com/openai/v1",
        });
    }
    return _groq;
}

export class GroqService {
    static async generateModuleContent(topic: string, types: string[] = ['FLASHCARD', 'MC', 'GAP', 'TF'], count: number = 5) {
        if (!process.env.GROQ_API_KEY) {
            return OpenAIService.getMockData(topic);
        }

        const systemPrompt = `
      You are an educational content generator. Topic: "${topic}".
      Task: Generate ${count} study items.
      Output strictly in JSON format:
      {
        "items": [
          { "type": "FLASHCARD", "front": "...", "back": "..." },
          { "type": "MC", "question": "...", "options": ["..."], "answer": "...", "explanation": "..." },
          { "type": "GAP", "text": "The {{gap}} is...", "answers": ["gap"] },
          { "type": "TRUE_FALSE", "statement": "...", "answer": "True", "explanation": "..." }
        ]
      }
    `;

        try {
            const response = await getGroq().chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Generate content for: ${topic}` },
                ],
                response_format: { type: "json_object" },
            });

            const content = response.choices[0].message.content || "{}";
            return safeJsonParse(content, GenerationSchema).items;
        } catch (error) {
            console.error("Groq Generation Error:", error);
            throw new Error("Yapay zeka içeriği oluşturamadı.");
        }
    }
}

let _openai: OpenAI | null = null;
function getOpenAI() {
    if (!_openai) {
        _openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || process.env.AUTH_OPENAI_ID,
        });
    }
    return _openai;
}

export class OpenAIService {
    static async generateModuleContent(topic: string, types: string[] = ['FLASHCARD', 'MC', 'GAP', 'TF'], count: number = 5) {
        if (!process.env.OPENAI_API_KEY) {
            return GroqService.generateModuleContent(topic, types, count);
        }

        try {
            const response = await getOpenAI().chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "Educational generator. Respond in JSON." },
                    { role: "user", content: `Topic: ${topic}` },
                ],
                response_format: { type: "json_object" },
            });

            const content = response.choices[0].message.content || "{}";
            return safeJsonParse(content, GenerationSchema).items;
        } catch (error) {
            console.error("OpenAI Generation Error:", error);
            return GroqService.generateModuleContent(topic, types, count);
        }
    }

    static getMockData(topic: string) {
        return [
            { type: "FLASHCARD", front: `${topic} - Temel Kavram`, back: "Tanım buraya gelecek." },
            { type: "MC", question: `${topic} hakkında hangisi doğrudur?`, options: ["Cevap A", "Cevap B", "Cevap C", "Cevap D"], answer: "Cevap A", explanation: "Çünkü doğru olan bu." },
            { type: "GAP", text: `Bu bir {{boşluk}} doldurma egzersizidir: ${topic}.`, answers: ["boşluk"] },
            { type: "TRUE_FALSE", statement: `${topic} önemli bir konudur.`, answer: "True", explanation: "Genel kabul." }
        ];
    }
}
