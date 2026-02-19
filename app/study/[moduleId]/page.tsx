"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useStudyStore, StudyMode } from "@/stores/study-store";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Placeholder for the actual study interface (we'll build this next)
import { StudyHeader } from "@/components/study/study-header";
import { FlashcardRenderer } from "@/components/study/flashcard-renderer";
import { QuizRenderer } from "@/components/study/quiz-renderer";
import { GapRenderer } from "@/components/study/gap-renderer";
import { StudyControls } from "@/components/study/study-controls";
import { StudySummary } from "@/components/study/study-summary";

// Placeholder for the actual study interface (we'll build this next)
function StudyInterface() {
    const { items, currentIndex, mode, nextItem, sessionId } = useStudyStore();
    const currentItem = items[currentIndex];

    // Handle session end
    if (!currentItem) {
        return <StudySummary />;
    }

    const handleNext = async (result: any) => {
        // Optimistic update handled in store/controls
        // Call API to log result
        try {
            await fetch('/api/study/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    itemId: result.itemId,
                    quality: result.quality, // 0-5
                    durationMs: 1000 // Placeholder, implement timer later
                })
            });
        } catch (error) {
            console.error("Failed to log progress", error);
        }

        // Advance
        nextItem();
    };

    return (
        <div className="flex flex-col items-center min-h-screen p-4 bg-slate-50 dark:bg-slate-950">
            <StudyHeader />

            <div className="flex-1 w-full flex flex-col items-center justify-center max-w-5xl">
                {/* Content Renderer */}
                {mode === 'QUIZ' || currentItem.type === 'MC' ? (
                    <QuizRenderer item={currentItem} />
                ) : currentItem.type === 'GAP' ? (
                    <GapRenderer item={currentItem} />
                ) : (
                    <FlashcardRenderer item={currentItem} />
                )}

                {/* Controls */}
                <StudyControls onNext={handleNext} />
            </div>
        </div>
    );
}

export default function StudyPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const initSession = useStudyStore(state => state.initSession);
    const sessionId = useStudyStore(state => state.sessionId);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const moduleId = params.moduleId as string;
    const mode = (searchParams.get('mode') as StudyMode) || 'NORMAL';

    useEffect(() => {
        // If we already have a session for THIS module, don't restart (unless forced?)
        // For simplicity, we always start fresh on page load for now to ensure sync.

        async function startSession() {
            try {
                setIsLoading(true);
                const res = await fetch('/api/study/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ moduleId, mode })
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Failed to start session");
                }

                const data = await res.json();

                if (data.items.length === 0) {
                    setError("No items found for this mode.");
                    setIsLoading(false);
                    return;
                }

                initSession(moduleId, data.items, mode);
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Something went wrong");
            } finally {
                setIsLoading(false);
            }
        }

        startSession();
    }, [moduleId, mode, initSession]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Initializing Study Session...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4 p-4 text-center">
                <AlertCircle className="h-10 w-10 text-destructive" />
                <h2 className="text-xl font-semibold">Could not start session</h2>
                <p className="text-muted-foreground max-w-sm">{error}</p>
                <Button variant="outline" onClick={() => router.push(`/modules/${moduleId}`)}>
                    Return to Module
                </Button>
            </div>
        );
    }

    return <StudyInterface />;
}
