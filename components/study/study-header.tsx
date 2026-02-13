import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X } from "lucide-react";
import Link from "next/link";
import { useStudyStore } from "@/stores/study-store";

export function StudyHeader() {
    const { currentIndex, items, moduleId } = useStudyStore();

    const progress = ((currentIndex + 1) / items.length) * 100;

    return (
        <div className="fixed top-0 left-0 right-0 h-16 border-b bg-background/95 backdrop-blur z-50 px-4 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/modules/${moduleId}`}>
                        <X className="h-5 w-5" />
                    </Link>
                </Button>
                <div className="flex flex-col flex-1 max-w-sm gap-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Card {currentIndex + 1} / {items.length}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* Timer placeholder */}
                <div className="text-sm font-mono text-muted-foreground hidden sm:block">
                    00:00
                </div>
            </div>
        </div>
    );
}
