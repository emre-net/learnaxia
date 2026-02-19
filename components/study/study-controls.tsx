"use client";

import { Button } from "@/components/ui/button";
import { useStudyStore } from "@/stores/study-store";
import { useSettingsStore } from "@/stores/settings-store";
import { getStudyDictionary } from "@/lib/i18n/dictionaries";
import { ArrowRight, Check, RotateCcw } from "lucide-react";
import { useEffect } from "react";

export function StudyControls({ onNext }: { onNext: (result: any) => void }) {
    const {
        items,
        currentIndex,
        mode,
        isFlipped,
        setIsFlipped,
        selectedOption,
        feedback,
        setFeedback,
        correctCount,
        setCorrectCount,
        wrongCount,
        setWrongCount
    } = useStudyStore();

    const { language } = useSettingsStore();
    const dict = getStudyDictionary(language);

    const currentItem = items[currentIndex];

    const handleNextItem = () => {
        onNext({
            itemId: currentItem.id,
            result: feedback === 'CORRECT' ? 'CORRECT' : 'WRONG',
            quality: feedback === 'CORRECT' ? 5 : 1
        });
    };

    const handleRate = (quality: number) => {
        // Quality: 0-1 (Wrong/Hard), 2-3 (Good/Ok), 4-5 (Easy/Perfect)
        // Map to: "AGAIN", "HARD", "GOOD", "EASY"
        let result = "GOOD";
        if (quality <= 1) result = "AGAIN";
        else if (quality <= 3) result = "HARD";
        else if (quality >= 5) result = "EASY";

        const isCorrect = quality > 1;
        if (isCorrect) setCorrectCount(correctCount + 1);
        else setWrongCount(wrongCount + 1);

        onNext({ itemId: currentItem.id, result, quality });
    };

    // Handle Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // QUIZ / MC / GAP: Next Question
            if (mode === 'QUIZ' || currentItem.type === 'MC' || currentItem.type === 'GAP') {
                if (feedback && (e.code === 'ArrowRight' || e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter')) {
                    e.preventDefault();
                    handleNextItem();
                }
                return;
            }

            // FLASHCARD: Flip & Vote
            if (e.code === 'Space') {
                e.preventDefault();
                if (!isFlipped) setIsFlipped(true);
            } else if (isFlipped) {
                switch (e.code) {
                    case 'ArrowLeft': handleRate(1); break; // Again
                    case 'ArrowDown': handleRate(2); break; // Hard
                    case 'ArrowUp': handleRate(4); break;   // Good 
                    case 'ArrowRight': handleRate(5); break; // Easy
                    case 'Digit1': handleRate(1); break;
                    case 'Digit2': handleRate(2); break;
                    case 'Digit3': handleRate(4); break;
                    case 'Digit4': handleRate(5); break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [mode, isFlipped, feedback, selectedOption, setIsFlipped, handleRate, currentItem]);

    if (mode === 'QUIZ' || currentItem.type === 'MC' || currentItem.type === 'GAP') {
        if (!feedback) {
            // GapRenderer handles its own check button.
            if (currentItem.type === 'GAP') return null;

            // For MC/TF, check is now immediate upon selection.
            // So we wait for feedback to appear.
            return null;
        }

        const isLastItem = currentIndex === items.length - 1;

        return (
            <div className="flex gap-4 mt-8 w-full max-w-md">
                <Button
                    className={isLastItem ? "w-full text-lg h-12 bg-green-600 hover:bg-green-700" : "w-full text-lg h-12"}
                    size="lg"
                    onClick={handleNextItem}
                >
                    {isLastItem ? (
                        <>{dict.finishSession} <Check className="ml-2 h-5 w-5" /></>
                    ) : (
                        <>{dict.nextQuestion} <ArrowRight className="ml-2 h-5 w-5" /></>
                    )}
                </Button>
            </div>
        );
    }

    // Flashcard Controls
    if (!isFlipped) {
        return (
            <div className="mt-8 text-muted-foreground text-sm">
                {dict.flipInstruction}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 mt-8 w-full max-w-2xl animate-in slide-in-from-bottom-4">
            <div className="grid grid-cols-4 gap-4">
                <Button variant="destructive" className="flex flex-col h-20 gap-1 hover:bg-red-600" onClick={() => handleRate(1)}>
                    <RotateCcw className="h-5 w-5" />
                    <span>{dict.rate.again}</span>
                    <span className="text-xs opacity-70">{dict.rate.againTime}</span>
                </Button>
                <Button variant="secondary" className="flex flex-col h-20 gap-1 bg-orange-100 hover:bg-orange-200 text-orange-900 border-orange-200" onClick={() => handleRate(2)}>
                    <span className="text-lg font-bold">{dict.rate.hard}</span>
                    <span className="text-xs opacity-70">{dict.rate.hardTime}</span>
                </Button>
                <Button variant="secondary" className="flex flex-col h-20 gap-1 bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-200" onClick={() => handleRate(4)}>
                    <span className="text-lg font-bold">{dict.rate.good}</span>
                    <span className="text-xs opacity-70">{dict.rate.goodTime}</span>
                </Button>
                <Button variant="secondary" className="flex flex-col h-20 gap-1 bg-green-100 hover:bg-green-200 text-green-900 border-green-200" onClick={() => handleRate(5)}>
                    <Check className="h-5 w-5" />
                    <span>{dict.rate.easy}</span>
                    <span className="text-xs opacity-70">{dict.rate.easyTime}</span>
                </Button>
            </div>
            <div className="text-center text-xs text-muted-foreground mt-2">
                {dict.keyboardHint}
            </div>
        </div>
    );
}
