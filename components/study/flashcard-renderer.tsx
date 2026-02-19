import { Card } from "@/components/ui/card";
import { useStudyStore } from "@/stores/study-store";
import { cn } from "@/lib/utils";

export function FlashcardRenderer({ item }: { item: any }) {
    const { isFlipped, setIsFlipped } = useStudyStore();

    return (
        <div
            className="w-full max-w-2xl h-[400px] cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
            style={{ perspective: '1000px' }}
        >
            <div
                className={cn(
                    "relative w-full h-full transition-transform duration-500",
                )}
                style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}
            >
                {/* Front */}
                <Card
                    className="absolute w-full h-full flex items-center justify-center p-8 text-center bg-background border-2 shadow-xl hover:shadow-2xl transition-shadow"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <div className="flex flex-col gap-4">
                        <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">SORU</span>
                        <h2 className="text-3xl font-bold">{item.content.question || item.content.front}</h2>
                        {/* Image placeholder */}
                        {item.content.image && (
                            <div className="h-40 w-full bg-muted rounded-md flex items-center justify-center">Image</div>
                        )}
                    </div>
                </Card>

                {/* Back */}
                <Card
                    className="absolute w-full h-full flex items-center justify-center p-8 text-center bg-secondary/10 border-2 border-primary/20 shadow-xl"
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                    }}
                >
                    <div className="flex flex-col gap-4">
                        <span className="text-sm text-primary uppercase tracking-wider font-semibold">CEVAP</span>
                        <h2 className="text-3xl font-bold text-primary">{item.content.answer || item.content.back}</h2>
                        {item.content.solution && (
                            <p className="text-muted-foreground text-sm mt-4 p-4 bg-background/50 rounded-lg">
                                {item.content.solution}
                            </p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
