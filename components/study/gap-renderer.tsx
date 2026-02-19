import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useStudyStore } from "@/stores/study-store";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export function GapRenderer({ item }: { item: any }) {
    const { setFeedback, feedback, setCorrectCount, correctCount, setWrongCount, wrongCount } = useStudyStore();
    const [userAnswers, setUserAnswers] = useState<string[]>([]);
    const [parts, setParts] = useState<string[]>([]);
    const [gapIndices, setGapIndices] = useState<number[]>([]);

    // Initialize state when item changes
    useEffect(() => {
        // Parse text: "The {{capital}} of France." -> ["The ", "{{capital}}", " of France."]
        const splitText = item.content.text.split(/(\{\{.*?\}\})/g);
        setParts(splitText);

        // Identify which parts are gaps
        const indices = splitText
            .map((part: string, index: number) => part.startsWith('{{') && part.endsWith('}}') ? index : -1)
            .filter((index: number) => index !== -1);

        setGapIndices(indices);
        setUserAnswers(new Array(indices.length).fill(""));
    }, [item.id, item.content.text]);

    const normalize = (s: string) => {
        return s
            .toLocaleLowerCase('tr')
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
            .replace(/\s{2,}/g, " ")
            .trim();
    };

    const checkAnswer = () => {
        if (userAnswers.some(a => !a.trim())) return;

        const correctAnswers = (item.content.answers || []).map(normalize);

        const results = userAnswers.map((ans, idx) => {
            const input = normalize(ans);
            const target = correctAnswers[idx]; // Assumes answers array matches gap order
            return input === target;
        });

        const allCorrect = results.every((r: boolean) => r);

        setFeedback(allCorrect ? 'CORRECT' : 'WRONG');

        // Store result for specific inputs (optional, or just rely on global feedback)
        // For UI, we can re-calculate validity during render if feedback is present.

        if (allCorrect) setCorrectCount(correctCount + 1);
        else setWrongCount(wrongCount + 1);
    };

    const handleInputChange = (index: number, value: string) => {
        if (feedback) return;
        const newAnswers = [...userAnswers];
        newAnswers[index] = value;
        setUserAnswers(newAnswers);
    };

    // Helper to determine gap index (0st gap, 1st gap...) from part index
    const getGapIndex = (partIndex: number) => {
        return gapIndices.indexOf(partIndex);
    };

    return (
        <div className="w-full max-w-3xl flex flex-col gap-8">
            <Card className="p-8 text-center border-2 shadow-sm min-h-[300px] flex flex-col items-center justify-center gap-8">
                <div className="text-2xl font-semibold leading-loose max-w-full">
                    {parts.map((part, i) => {
                        const isGap = part.startsWith('{{') && part.endsWith('}}');

                        if (isGap) {
                            const gapIndex = getGapIndex(i);
                            const answer = userAnswers[gapIndex] || "";

                            // Determine style based on feedback
                            let borderColor = "border-input";
                            let bgColor = "bg-background";
                            let textColor = "text-foreground";

                            if (feedback) {
                                const normalizedInput = normalize(answer);
                                const normalizedTarget = normalize(item.content.answers?.[gapIndex] || "");
                                const isCorrect = normalizedInput === normalizedTarget;

                                borderColor = isCorrect ? "border-green-500" : "border-red-500";
                                bgColor = isCorrect ? "bg-green-50" : "bg-red-50";
                                textColor = isCorrect ? "text-green-700" : "text-red-700";
                            }

                            return (
                                <span key={i} className="inline-block mx-1 align-middle">
                                    <Input
                                        value={answer}
                                        onChange={(e) => handleInputChange(gapIndex, e.target.value)}
                                        className={cn(
                                            "w-32 h-10 text-center font-medium transition-all inline-flex",
                                            borderColor, bgColor, textColor,
                                            !feedback && "focus:ring-2 focus:ring-primary focus:border-primary"
                                        )}
                                        disabled={!!feedback}
                                        placeholder="?"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                // If it's the last input, check answer
                                                if (gapIndex === gapIndices.length - 1) checkAnswer();
                                                // Else focus next? (Browser default tab works usually)
                                            }
                                        }}
                                    />
                                </span>
                            );
                        }

                        return <span key={i}>{part}</span>;
                    })}
                </div>
            </Card>

            {!feedback && (
                <Button
                    className="w-full h-12 text-lg"
                    size="lg"
                    onClick={checkAnswer}
                    disabled={userAnswers.some(a => !a.trim())}
                >
                    Kontrol Et
                </Button>
            )}

            {feedback && (
                <div className={cn(
                    "p-6 rounded-lg text-center font-medium animate-in fade-in slide-in-from-bottom-2 border-2",
                    feedback === 'CORRECT'
                        ? "bg-green-100/50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                        : "bg-red-100/50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                )}>
                    {feedback === 'CORRECT' ? (
                        <div className="flex flex-col gap-2 items-center">
                            <CheckCircle2 className="h-8 w-8 text-green-600 mb-1" />
                            <span className="text-xl font-bold">Harika! Hepsi Doğru 🎉</span>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-center gap-2 text-xl font-bold text-red-600">
                                <XCircle className="h-6 w-6" />
                                <span>Bazı Cevaplar Yanlış</span>
                            </div>
                            <div className="text-sm opacity-90 mt-2 bg-background/50 p-4 rounded-md inline-block max-w-lg mx-auto">
                                <span className="block mb-2 font-semibold text-foreground/80">Doğru Cevaplar:</span>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {item.content.answers.map((ans: string, i: number) => (
                                        <span key={i} className="px-2 py-1 bg-primary/10 rounded border border-primary/20 text-primary font-mono">
                                            {i + 1}. {ans}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
