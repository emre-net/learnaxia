import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useStudyStore } from "@/stores/study-store";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";

export function QuizRenderer({ item }: { item: any }) {
    const { selectedOption, setSelectedOption, feedback } = useStudyStore();

    // Ensure options exist
    const options = item.content.options || [];

    return (
        <div className="w-full max-w-2xl flex flex-col gap-8">
            <Card className="p-8 text-center border-2 shadow-sm">
                <h2 className="text-2xl font-semibold">{item.content.question}</h2>
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
                        <Button
                            key={idx}
                            variant={variant as any}
                            className={cn(
                                "h-auto py-6 text-lg justify-start px-6 relative",
                                isSelected && !feedback && "ring-2 ring-primary"
                            )}
                            onClick={() => !feedback && setSelectedOption(option)}
                            disabled={!!feedback}
                        >
                            <span className="mr-auto">{option}</span>
                            {feedback && isCorrect && <CheckCircle2 className="h-5 w-5 text-green-500 absolute right-4" />}
                            {feedback && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-white absolute right-4" />}
                        </Button>
                    );
                })}
            </div>

            {feedback && (
                <div className={cn(
                    "p-4 rounded-lg text-center font-medium animate-in fade-in slide-in-from-bottom-2",
                    feedback === 'CORRECT' ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                )}>
                    {feedback === 'CORRECT' ? "Doğru! 🎉" : "Yanlış 😔"}
                </div>
            )}
        </div>
    );
}
