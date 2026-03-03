import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || "mock-key",
    baseURL: process.env.GROQ_API_KEY ? "https://api.groq.com/openai/v1" : undefined
});

export interface SyllabusItem {
    order: number;
    title: string;
    overview: string;
    estimatedMinutes: number;
}

export async function generateSyllabus(
    topic: string,
    goal: string = "",
    depth: "shallow" | "standard" | "comprehensive" = "standard"
): Promise<SyllabusItem[]> {

    // MOCK DATA FOR DEVELOPMENT IF NO REAL KEY
    if (process.env.NODE_ENV !== 'production' && !process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY) {
        console.warn("Using MOCK Syllabus Generation due to missing API Key");
        const multiplier = depth === "shallow" ? 3 : depth === "standard" ? 5 : 8;
        return Array.from({ length: multiplier }).map((_, i) => ({
            order: i + 1,
            title: `Understanding ${topic} - Part ${i + 1}`,
            overview: `This section drops into the fundamentals of ${topic}, addressing the goal: ${goal || 'General Mastery'}.`,
            estimatedMinutes: Math.floor(Math.random() * 10) + 5
        }));
    }

    try {
        const systemPrompt = `You are an expert curriculum designer and educator.
                             Create a highly engaging, structured, and logical learning syllabus (journey) for the user's requested topic.
                             The target audience wants a ${depth} level of understanding.
                             
                             Output MUST BE valid JSON representing an array of syllabus sections/slides.
                             Schema:
                             {
                               "syllabus": [
                                  {
                                    "order": number (1-based index),
                                    "title": "string (Catchy title for the sub-topic)",
                                    "overview": "string (A brief 1-2 sentence overview of what this section covers)",
                                    "estimatedMinutes": number (Estimated time to consume)
                                  }
                               ]
                             }
                             
                             Provide AT LEAST 3 items and AT MOST 10 items depending on the depth and topic breadth.`;

        const completion = await openai.chat.completions.create({
            model: process.env.GROQ_API_KEY ? "llama-3.3-70b-versatile" : "gpt-4o-mini", // Use groq or fallback to openai
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Topic: ${topic}\nLearning Goal: ${goal || 'General Mastery'}\nDepth Required: ${depth}\n\nGenerate the syllabus array in JSON.` }
            ],
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0]?.message?.content;

        if (!content) {
            throw new Error("No content received from AI");
        }

        const parsed = JSON.parse(content);
        if (parsed.syllabus && Array.isArray(parsed.syllabus)) {
            return parsed.syllabus;
        }

        // Fallback for arrays
        if (Array.isArray(parsed)) {
            return parsed;
        }

        throw new Error("Invalid output format from AI");

    } catch (error: any) {
        console.error("[generateSyllabus] Error:", error);
        throw new Error(`Failed to generate syllabus: ${error.message}`);
    }
}
