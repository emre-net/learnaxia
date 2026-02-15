import OpenAI from "openai";
import { z } from "zod";

let _openai: OpenAI | null = null;
function getOpenAI() {
    if (!_openai) {
        _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return _openai;
}

// Zod Schemas for Validation
const FlashcardSchema = z.object({
    type: z.literal("FLASHCARD"),
    front: z.string(),
    back: z.string(),
});

const MCSchema = z.object({
    type: z.literal("MC"),
    question: z.string(),
    options: z.array(z.string()),
    answer: z.string(),
    explanation: z.string().optional(),
});

const GapSchema = z.object({
    type: z.literal("GAP"),
    text: z.string(), // "The {{capital}} of France is {{Paris}}."
    answers: z.array(z.string()),
});

const TFSchema = z.object({
    type: z.literal("TF"),
    statement: z.string(),
    answer: z.enum(["True", "False"]),
    explanation: z.string().optional()
});

const GenerationSchema = z.object({
    items: z.array(z.union([FlashcardSchema, MCSchema, GapSchema, TFSchema])),
});

export class OpenAIService {
    static async generateModuleContent(topic: string, types: ('FLASHCARD' | 'MC' | 'GAP' | 'TF')[] = ['FLASHCARD', 'MC', 'GAP', 'TF'], count: number = 5) {
        if (!process.env.OPENAI_API_KEY) {
            // Mock fallback for development if key is missing
            console.warn("OPENAI_API_KEY missing, returning mock data.");
            return OpenAIService.getMockData(topic);
        }

        const typePrompts = {
            FLASHCARD: `Flashcards: Front (Term/Question) and Back (Definition/Answer).`,
            MC: `Multiple Choice: Question, 4 Options, Correct Answer, Explanation.`,
            GAP: `Gap Fill: Sentence with {{double curly braces}} around hidden words. Provide answers list.`,
            TF: `True/False: Statement, Answer ("True" or "False"), Explanation.`
        };

        const selectedTypes = types.map(t => typePrompts[t]).join("\n");

        const systemPrompt = `
      You are an educational content generator.
      Task: Generate ${count} study items about "${topic}".
      Allowed Types:
      ${selectedTypes}
      
      Output strictly in JSON format matching this schema:
      {
        "items": [
          { "type": "FLASHCARD", "front": "...", "back": "..." },
          { "type": "MC", "question": "...", "options": ["..."], "answer": "...", "explanation": "..." },
          { "type": "GAP", "text": "The {{capital}} is...", "answers": ["capital"] },
          { "type": "TF", "statement": "...", "answer": "True", "explanation": "..." }
        ]
      }
    `;

        try {
            const response = await getOpenAI().chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Generate ${count} items about: ${topic}` },
                ],
                response_format: { type: "json_object" },
            });

            const content = JSON.parse(response.choices[0].message.content || "{}");
            const parsed = GenerationSchema.parse(content);
            return parsed.items;
        } catch (error) {
            console.error("AI Generation Error:", error);
            throw new Error("Failed to generate content.");
        }
    }

    static getMockData(topic: string) {
        return [
            { type: "FLASHCARD", front: `${topic} Basic Concept`, back: "A fundamental idea." },
            { type: "MC", question: `What is true about ${topic}?`, options: ["Option A", "Option B", "Option C", "Option D"], answer: "Option A", explanation: "Because it is true." },
            { type: "GAP", text: `This is a {{gap}} fill exercise about ${topic}.`, answers: ["gap"] },
            { type: "TF", statement: `${topic} is interesting.`, answer: "True", explanation: "Subjective but accepted." }
        ];
    }
}
