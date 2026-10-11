import { z } from "zod";

export const FlashcardSchema = z.object({
    type: z.literal("FLASHCARD"),
    front: z.string(),
    back: z.string(),
});

export const MCSchema = z.object({
    type: z.literal("MC"),
    question: z.string(),
    options: z.array(z.string()),
    answer: z.string(),
    explanation: z.string().optional(),
});

export const GapSchema = z.object({
    type: z.literal("GAP"),
    text: z.string(), // "The {{capital}} of France is {{Paris}}."
    answers: z.array(z.string()),
});

export const TFSchema = z.object({
    type: z.literal("TRUE_FALSE"),
    statement: z.string(),
    answer: z.enum(["True", "False"]),
    explanation: z.string().optional()
});

export const GenerationSchema = z.object({
    items: z.array(z.union([FlashcardSchema, MCSchema, GapSchema, TFSchema])),
});

export const EvaluationSchema = z.object({
    isValid: z.boolean(),
    feedback: z.string().optional()
});

export const VisionSchema = z.object({
    questionText: z.string(),
    solution: z.string(),
    isQuestionPresent: z.boolean(),
    isReadable: z.boolean(),
    hasMultipleQuestions: z.boolean()
});

export const SlideGenerationSchema = z.object({
    title: z.string(),
    content: z.string(),
    peekingQuestion: z.object({
        question: z.string(),
        options: z.array(z.string()),
        answer: z.string(),
        explanation: z.string()
    }).optional()
});

export type SlideGeneration = z.infer<typeof SlideGenerationSchema>;
export type Flashcard = z.infer<typeof FlashcardSchema>;
export type MC = z.infer<typeof MCSchema>;
export type Gap = z.infer<typeof GapSchema>;
export type TF = z.infer<typeof TFSchema>;
export type Generation = z.infer<typeof GenerationSchema>;
export type Evaluation = z.infer<typeof EvaluationSchema>;
export type Vision = z.infer<typeof VisionSchema>;
