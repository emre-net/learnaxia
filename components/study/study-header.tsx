import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useStudyStore } from "@/stores/study-store";
import { X } from "lucide-react";
import Link from "next/link";

export function StudyHeader() {
    const {
        items,
        currentIndex,
        correctCount,
        wrongCount,
        moduleId
    } = useStudyStore();

    if (!items.length) return null;

    const progress = ((currentIndex) / items.length) * 100;

    return (
        <header className="w-full max-w-5xl flex items-center justify-between py-4 mb-8">
            <div className="flex items-center gap-4 flex-1">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/modules/${moduleId}`}>
                        <X className="h-5 w-5" />
                    </Link>
                </Button>
                <div className="flex flex-col w-full max-w-xs gap-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{currentIndex + 1} / {items.length}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            </div>

            <div className="flex gap-4 text-sm font-medium">
                <span className="text-green-500">{correctCount} Correct</span>
                <span className="text-red-500">{wrongCount} Wrong</span>
            </div>
        </header>
    );
}
