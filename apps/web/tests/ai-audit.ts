
import { OpenAIAIProvider } from "../domains/ai/openai.provider";
import * as dotenv from "dotenv";

dotenv.config();

const provider = new OpenAIAIProvider();

async function runAudit() {
    console.log("=== AI Platform Audit Started ===\n");

    const scenarios = [
        {
            name: "Note Generation (valid)",
            task: () => provider.generateNote("Photosynthesis process in plants", "en"),
            validator: (res: string) => res.includes("<h1>") || res.includes("<h2>")
        },
        {
            name: "Syllabus Generation (valid)",
            task: () => provider.generateSyllabus("Quantum Mechanics", "Introductory level", "standard", "en"),
            validator: (res: any[]) => Array.isArray(res) && res.length >= 3
        },
        {
            name: "Journey Slide Generation (valid)",
            task: () => provider.generateJourneySlide("Chlorophyll", "Photosynthesis", "detailed", "en"),
            validator: (res: any) => !!res.title && !!res.peekingQuestion
        },
        {
            name: "Module Generation (valid)",
            task: () => provider.generateContent("General Relativity", ["FLASHCARD", "MC"], 5, "detailed", "en"),
            validator: (res: any[]) => Array.isArray(res) && res.length > 0
        }
    ];

    for (const scenario of scenarios) {
        process.stdout.write(`Testing ${scenario.name}... `);
        try {
            const result = await scenario.task();
            if (scenario.validator(result)) {
                console.log("✅ PASS");
            } else {
                console.log("❌ FAIL (Validation Failed)");
                console.log("Result:", JSON.stringify(result, null, 2).substring(0, 200));
            }
        } catch (error: any) {
            console.log(`❌ FAIL (Error: ${error.message})`);
        }
    }

    console.log("\n=== Audit Complete ===");
}

runAudit().catch(console.error);
