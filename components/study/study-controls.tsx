import { Button } from "@/components/ui/button";
import { useStudyStore } from "@/stores/study-store";
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

    const currentItem = items[currentIndex];

    const handleQuizCheck = () => {
        if (!selectedOption) return;

        const isCorrect = selectedOption === currentItem.content.answer;
        setFeedback(isCorrect ? 'CORRECT' : 'WRONG');

        if (isCorrect) setCorrectCount(correctCount + 1);
        else setWrongCount(wrongCount + 1);
    };

    const handleNextItem = () => {
        onNext({ itemId: currentItem.id, result: feedback === 'CORRECT' ? 'CORRECT' : 'WRONG', quality: 3 });
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
                if (feedback && (e.code === 'ArrowRight' || e.code === 'Space')) {
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
                    case 'ArrowUp': handleRate(4); break;   // Good (Map to 4 for simple 3-button, or 3) -> 4 per button layout (Good is 4, Easy is 5? No, buttons are 1,2,4,5 in UI? Wait UI has 4 buttons: Again(1), Hard(2), Good(4), Easy(5)?? Let's check handleRate logic.)
                    // UI calls: handleRate(1), (2), (4), (5).
                    // Logic: 1->Again, 2->Hard, 4->Good, 5->Easy.
                    // So Map: Left->1, Down->2, Up->4, Right->5?
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
    }, [mode, isFlipped, feedback, selectedOption, setIsFlipped, handleRate, currentItem]); // Added deps

    if (mode === 'QUIZ' || currentItem.type === 'MC' || currentItem.type === 'GAP') {
        if (!feedback) {
            // GapRenderer handles its own check for now, but controls might need to hide
            // actually GapRenderer has its own check button.
            // StudyControls only needs to show "Next" when feedback is present.
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
                        <>Çalışmayı Bitir <Check className="ml-2 h-5 w-5" /></>
                    ) : (
                        <>Sonraki Soru <ArrowRight className="ml-2 h-5 w-5" /></>
                    )}
                </Button>
            </div>
        );
    }

    // Flashcard Controls
    if (!isFlipped) {
        return (
            <div className="mt-8 text-muted-foreground text-sm">
                Çevirmek için <kbd className="px-2 py-1 bg-muted rounded border">Boşluk</kbd> tuşuna basın veya karta tıklayın
            </div>
        );
    }

    // Check if last item for Flashcards too (though UI doesn't change much for rating buttons)
    // We could add a "Finish" indicator, but the rating action naturally moves forward.
    // The store update will handle the redirection.

    return (
        <div className="flex flex-col gap-4 mt-8 w-full max-w-2xl animate-in slide-in-from-bottom-4">
            <div className="grid grid-cols-4 gap-4">
                <Button variant="destructive" className="flex flex-col h-20 gap-1 hover:bg-red-600" onClick={() => handleRate(1)}>
                    <RotateCcw className="h-5 w-5" />
                    <span>Tekrar</span>
                    <span className="text-xs opacity-70">&lt; 1d</span>
                </Button>
                <Button variant="secondary" className="flex flex-col h-20 gap-1 bg-orange-100 hover:bg-orange-200 text-orange-900 border-orange-200" onClick={() => handleRate(2)}>
                    <span className="text-lg font-bold">Zor</span>
                    <span className="text-xs opacity-70">2g</span>
                </Button>
                <Button variant="secondary" className="flex flex-col h-20 gap-1 bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-200" onClick={() => handleRate(4)}>
                    <span className="text-lg font-bold">İyi</span>
                    <span className="text-xs opacity-70">4g</span>
                </Button>
                <Button variant="secondary" className="flex flex-col h-20 gap-1 bg-green-100 hover:bg-green-200 text-green-900 border-green-200" onClick={() => handleRate(5)}>
                    <Check className="h-5 w-5" />
                    <span>Kolay</span>
                    <span className="text-xs opacity-70">7g</span>
                </Button>
            </div>
            <div className="text-center text-xs text-muted-foreground mt-2">
                Puanlamak için <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd> tuşlarını kullanın
            </div>
        </div>
    );
}
