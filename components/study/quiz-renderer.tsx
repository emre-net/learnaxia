"use client";

import { useStudyStore } from "@/stores/study-store";
import { useSettingsStore } from "@/stores/settings-store";
import { getStudyDictionary } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { playStudySound } from "@/lib/audio";

export function QuizRenderer({ item }: { item: any }) {
    const {
        selectedOption,
        setSelectedOption,
        feedback,
        setFeedback,
        setCorrectCount,
        correctCount,
        setWrongCount,
        wrongCount
    } = useStudyStore();

    const { language } = useSettingsStore();
    const dict = getStudyDictionary(language);

    // Ensure options exist
    const options = item.content.options || [];

    // Keyboard support for 1-4
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (feedback) return; // Disable input during feedback
            const index = parseInt(e.key) - 1;
            if (!isNaN(index) && index >= 0 && index < options.length) {
                setSelectedOption(options[index]);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [options, setSelectedOption, feedback]);

    return (
        <div className="w-full max-w-2xl flex flex-col gap-8">
            <Card className="p-8 text-center border-2 shadow-sm prose dark:prose-invert max-w-none">
                <div className="text-2xl font-semibold">
                    <ReactMarkdown>{item.content.question}</ReactMarkdown>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {options.map((option: string, idx: number) => {
                    const isSelected = selectedOption === option;
                    const isCorrect = option === item.content.answer;

                    let variant = "outline";
                    if (feedback) {
                        if (isCorrect) variant = "default"; // Show correct answer
                        else if (isSelected && !isCorrect) variant = "destructive"; // Show wrong selection
                        else variant = "outline";
                    } else {
                        variant = isSelected ? "secondary" : "outline";
                    }

                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <Button
                                variant={variant as any}
                                className={cn(
                                    "w-full h-auto py-6 text-lg justify-start px-6 relative transition-all duration-300",
                                    isSelected && !feedback && "ring-2 ring-primary scale-[1.02]",
                                    feedback && isCorrect && "bg-green-600 hover:bg-green-700 text-white border-green-600",
                                    feedback && isSelected && !isCorrect && "bg-red-600 hover:bg-red-700 text-white border-red-600"
                                )}
                                onClick={() => {
                                    if (feedback) return;
                                    setSelectedOption(option);
                                }}
                                disabled={!!feedback}
                            >
                                <span className="mr-4 text-xs font-mono text-muted-foreground opacity-50 border rounded w-6 h-6 flex items-center justify-center shrink-0">
                                    {idx + 1}
                                </span>
                                <div className="mr-auto text-left prose dark:prose-invert prose-sm">
                                    <ReactMarkdown>
                                        {(option === 'True' || option === 'False')
                                            ? (dict[option.toLowerCase() as 'true' | 'false'] as string)
                                            : option}
                                    </ReactMarkdown>
                                </div>
                                {feedback && isCorrect && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute right-4"
                                    >
                                        <CheckCircle2 className="h-6 w-6 text-white" />
                                    </motion.div>
                                )}
                                {feedback && isSelected && !isCorrect && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute right-4"
                                    >
                                        <XCircle className="h-6 w-6 text-white" />
                                    </motion.div>
                                )}
                            </Button>
                        </motion.div>
                    );
                })}
            </div>

            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={cn(
                            "p-6 rounded-xl text-center font-bold text-lg shadow-lg border-2",
                            feedback === 'CORRECT'
                                ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                                : "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                        )}
                    >
                        <div className="flex items-center justify-center gap-3">
                            {feedback === 'CORRECT' ? (
                                <>
                                    <CheckCircle2 className="h-8 w-8" />
                                    <span>{dict.correct}</span>
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-8 w-8" />
                                    <span>
                                        {dict.wrong.replace('{answer}', (item.content.answer === 'True' || item.content.answer === 'False')
                                            ? (dict[item.content.answer.toLowerCase() as 'true' | 'false'] as string)
                                            : item.content.answer)}
                                    </span>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
