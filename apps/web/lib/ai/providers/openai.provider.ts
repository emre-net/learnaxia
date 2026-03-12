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

export async function validateTopic(topic: string, language: string = "tr"): Promise<{ isValid: boolean, reason?: string }> {
    if (!process.env.GROQ_API_KEY) return { isValid: true }; // Bypass in dev if no key

    const systemPrompt = `
        You are a strict validation AI for an educational platform.
        Your job is to determine if the user's input is a valid, meaningful topic to learn about, or if it is nonsense/gibberish (e.g., "hello", "asdfg", "test1234").
        
        IMPORTANT: Your response MUST be in this language: ${language.toUpperCase()}. If it is 'tr', write the "reason" in Turkish.
        
        Return JSON format:
        {
          "isValid": boolean,
          "reason": "If isValid is false, explain briefly and nicely why it's not a valid topic to learn, in the user's language."
        }
    `;

    try {
        const response = await openai.chat.completions.create({
            model: process.env.GROQ_API_KEY ? "llama-3.3-70b-versatile" : "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Topic input to validate: "${topic}"` }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(content);
        return {
            isValid: parsed.isValid === undefined ? true : parsed.isValid,
            reason: parsed.reason
        };
    } catch (e) {
        // If validation fails itself, we'll let the user proceed to not block them
        console.error("Topic Validation Error:", e);
        return { isValid: true };
    }
}

export async function generateSyllabus(
    topic: string,
    goal: string = "",
    depth: "shallow" | "standard" | "comprehensive" = "standard",
    language: string = "tr",
    instruction: string = "",
    existingSyllabus: SyllabusItem[] = []
): Promise<SyllabusItem[]> {

    // MOCK DATA FOR DEVELOPMENT
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

    const baseSystemPrompt = `You are an expert curriculum designer and educator.
                             Create a highly engaging, structured, and logical learning syllabus (journey) for the user's requested topic.
                             The target audience wants a ${depth} level of understanding.
                             
                             IMPORTANT RULES:
                             1. Language: ${language.toUpperCase()}.
                             2. Content: Balanced and logically sequenced.
                             ${instruction ? `3. SPECIAL INSTRUCTION: ${instruction}` : ""}
                             
                             Output JSON format:
                             {
                               "syllabus": [
                                  {
                                    "order": number,
                                    "title": "string",
                                    "overview": "string",
                                    "estimatedMinutes": number
                                  }
                               ]
                             }
                             
                             Provide 3-10 items.`;

    let currentSyllabus: SyllabusItem[] = [];
    let feedback = "";
    const MAX_RETRIES = 1;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const systemPrompt = feedback
            ? `${baseSystemPrompt}\n\nPREVIOUS ATTEMPT FEEDBACK: ${feedback}`
            : baseSystemPrompt;

        try {
            // 1. Generator AI
            const completion = await openai.chat.completions.create({
                model: process.env.GROQ_API_KEY ? "llama-3.3-70b-versatile" : "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { 
                        role: "user", 
                        content: `Topic: ${topic}\nLearning Goal: ${goal || 'General Mastery'}\nDepth Required: ${depth}\n` +
                                 `${existingSyllabus?.length > 0 ? `CURRENT SYLLABUS: ${JSON.stringify(existingSyllabus, null, 2)}\n` : ""}` +
                                 `Generate the NEW/MODIFIED syllabus array in JSON.` 
                    }
                ],
                response_format: { type: "json_object" }
            });

            const content = completion.choices[0]?.message?.content || "{}";
            const parsed = JSON.parse(content);
            currentSyllabus = parsed.syllabus || (Array.isArray(parsed) ? parsed : []);

            if (attempt === MAX_RETRIES) break;

            // 2. Evaluator AI
            const evaluatorPrompt = `
                You are an elite curriculum reviewer.
                Review the generated syllabus for logical flow, topic coverage, and language consistency (${language.toUpperCase()}).
                
                Topic: ${topic}
                Goal: ${goal}
                Depth: ${depth}
                
                Respond ONLY with JSON:
                {
                  "isValid": boolean,
                  "feedback": "string, if false"
                }
            `;

            const evalResponse = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: evaluatorPrompt },
                    { role: "user", content: `Review this syllabus:\n\n${JSON.stringify(currentSyllabus, null, 2)}` }
                ],
                response_format: { type: "json_object" }
            });

            const evalParsed = JSON.parse(evalResponse.choices[0]?.message?.content || "{}");
            if (evalParsed.isValid) break;
            feedback = evalParsed.feedback || "Logical flow needs improvement.";

        } catch (error: any) {
            console.error(`Syllabus Generation Error (Attempt ${attempt}):`, error);
            if (attempt === MAX_RETRIES) throw new Error(`Failed to generate syllabus: ${error.message}`);
            feedback = `Error occurred: ${error.message}. Please generate valid JSON.`;
        }
    }

    return currentSyllabus;
}
