import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useStudyStore } from "@/stores/study-store";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export function GapRenderer({ item }: { item: any }) {
    const { setFeedback, feedback, setCorrectCount, correctCount, setWrongCount, wrongCount } = useStudyStore();
    const [userAnswer, setUserAnswer] = useState("");

    // Reset local state when item changes
    useEffect(() => {
        setUserAnswer("");
    }, [item.id]);

    const checkAnswer = () => {
        if (!userAnswer.trim()) return;

        // Normalize answers (case insensitive, trim)
        const normalize = (s: string) => s.toLowerCase().trim();
        const correctAnswers = (item.content.answers || []).map(normalize);
        const input = normalize(userAnswer);

        const isCorrect = correctAnswers.includes(input);

        setFeedback(isCorrect ? 'CORRECT' : 'WRONG');

        if (isCorrect) setCorrectCount(correctCount + 1);
        else setWrongCount(wrongCount + 1);
    };

    return (
        <div className="w-full max-w-2xl flex flex-col gap-8">
            <Card className="p-8 text-center border-2 shadow-sm min-h-[200px] flex flex-col items-center justify-center gap-6">
                <h2 className="text-2xl font-semibold leading-relaxed">
                    {item.content.text.split('___').map((part: string, i: number, arr: string[]) => (
                        <span key={i}>
                            {part}
                            {i < arr.length - 1 && (
                                <span className="inline-block mx-1 w-24 border-b-2 border-foreground/20 relative top-1"></span>
                            )}
                        </span>
                    ))}
                </h2>

                <div className="w-full max-w-sm relative">
                    <Input
                        value={userAnswer}
                        onChange={(e) => !feedback && setUserAnswer(e.target.value)}
                        placeholder="Type answer here..."
                        className={cn(
                            "text-center text-lg h-12",
                            feedback === 'CORRECT' && "border-green-500 bg-green-50 text-green-700",
                            feedback === 'WRONG' && "border-red-500 bg-red-50 text-red-700"
                        )}
                        disabled={!!feedback}
                        onKeyDown={(e) => e.key === 'Enter' && !feedback && checkAnswer()}
                    />
                    {feedback === 'CORRECT' && <CheckCircle2 className="absolute right-3 top-3.5 text-green-500 h-5 w-5" />}
                    {feedback === 'WRONG' && <XCircle className="absolute right-3 top-3.5 text-red-500 h-5 w-5" />}
                </div>
            </Card>

            {!feedback && (
                <Button
                    className="w-full h-12 text-lg"
                    size="lg"
                    onClick={checkAnswer}
                    disabled={!userAnswer.trim()}
                >
                    Check
                </Button>
            )}

            {feedback && (
                <div className={cn(
                    "p-4 rounded-lg text-center font-medium animate-in fade-in slide-in-from-bottom-2",
                    feedback === 'CORRECT' ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                )}>
                    {feedback === 'CORRECT' ? (
                        <span>Doğru! 🎉</span>
                    ) : (
                        <div className="flex flex-col gap-1">
                            <span>Yanlış 😔</span>
                            <span className="text-sm opacity-80">Doğru Cevap: <strong>{item.content.answers[0]}</strong></span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
