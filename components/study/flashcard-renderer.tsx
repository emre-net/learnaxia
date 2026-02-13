import { useStudyStore } from "@/stores/study-store";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeftRight } from "lucide-react";

export function FlashcardRenderer() {
    const { items, currentIndex, isFlipped, flipCard } = useStudyStore();
    const currentItem = items[currentIndex];

    // Ensure content structure (Flashcard usually has 'front' and 'back' in JSON)
    const content = currentItem?.content as { front: string; back: string } | undefined;

    if (!content) return null;

    return (
        <div
            className="w-full max-w-2xl aspect-[4/3] perspective-1000 cursor-pointer"
            onClick={flipCard}
        >
            <div className={cn(
                "relative w-full h-full transition-all duration-500 transform-style-3d",
                isFlipped ? "rotate-y-180" : ""
            )}>
                {/* Front Face */}
                <div className="absolute w-full h-full backface-hidden">
                    <Card className="w-full h-full flex flex-col items-center justify-center p-8 bg-card border shadow-xl hover:shadow-2xl transition-shadow">
                        <CardContent className="text-center">
                            <h3 className="text-2xl sm:text-3xl font-medium leading-relaxed">
                                {content.front}
                            </h3>
                            <div className="absolute bottom-4 right-4 text-xs text-muted-foreground flex items-center gap-1 opacity-50">
                                <ArrowLeftRight className="h-3 w-3" />
                                Tap to flip
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Back Face */}
                <div className="absolute w-full h-full backface-hidden rotate-y-180">
                    <Card className="w-full h-full flex flex-col items-center justify-center p-8 bg-card border-2 border-primary/20 shadow-xl">
                        <CardContent className="text-center">
                            <h3 className="text-xl sm:text-2xl font-normal leading-relaxed text-foreground/90">
                                {content.back}
                            </h3>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <style jsx global>{`
                .perspective-1000 { perspective: 1000px; }
                .transform-style-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
            `}</style>
        </div>
    );
}
