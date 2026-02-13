import { Button } from "@/components/ui/button";
import { useStudyStore, StudyMode } from "@/stores/study-store";
import { ChevronRight, Eye, RefreshCcw, ThumbsUp, ThumbsDown, Zap } from "lucide-react";
import { calculateSM2 } from "@/lib/sm2"; // We might move logic to store later

export function StudyControls() {
    const {
        isFlipped,
        flipCard,
        nextItem,
        items,
        currentIndex,
        mode
    } = useStudyStore();

    // Handler for SM-2 Grading
    const handleGrade = async (quality: number) => {
        const { sessionId } = useStudyStore.getState();
        const currentItem = items[currentIndex];

        if (currentItem && sessionId) {
            try {
                // Determine duration (simple version: now - last action time)
                // For MVP: default to 1000ms until we track time per card
                const durationMs = 1000;

                await fetch('/api/study/log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId,
                        itemId: currentItem.id,
                        quality,
                        durationMs
                    })
                });
            } catch (e) {
                console.error("Failed to log progress", e);
            }
        }

        nextItem();
    };

    if (!isFlipped) {
        return (
            <div className="fixed bottom-0 left-0 right-0 p-4 border-t bg-background/95 backdrop-blur z-50 flex justify-center">
                <Button size="lg" className="w-full max-w-sm text-lg h-14" onClick={flipCard}>
                    <Eye className="mr-2 h-5 w-5" />
                    Show Answer
                </Button>
            </div>
        );
    }

    // Flipped State Controls
    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 border-t bg-background/95 backdrop-blur z-50">
            <div className="max-w-2xl mx-auto grid grid-cols-4 gap-2">
                <Button
                    variant="destructive"
                    className="flex flex-col h-16 gap-1"
                    onClick={() => handleGrade(0)}
                >
                    <RefreshCcw className="h-4 w-4" />
                    <span className="text-xs">Again</span>
                </Button>

                <Button
                    variant="secondary"
                    className="flex flex-col h-16 gap-1 bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    onClick={() => handleGrade(3)}
                >
                    <ThumbsDown className="h-4 w-4" />
                    <span className="text-xs">Hard</span>
                </Button>

                <Button
                    variant="secondary"
                    className="flex flex-col h-16 gap-1 bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    onClick={() => handleGrade(4)}
                >
                    <ThumbsUp className="h-4 w-4" />
                    <span className="text-xs">Good</span>
                </Button>

                <Button
                    variant="secondary"
                    className="flex flex-col h-16 gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    onClick={() => handleGrade(5)}
                >
                    <Zap className="h-4 w-4" />
                    <span className="text-xs">Easy</span>
                </Button>
            </div>
        </div>
    );
}
