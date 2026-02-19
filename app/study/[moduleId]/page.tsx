"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useStudyStore, StudyMode } from "@/stores/study-store";
import { useSettingsStore } from "@/stores/settings-store";
import { getStudyDictionary } from "@/lib/i18n/dictionaries";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

import { StudyHeader } from "@/components/study/study-header";
import { FlashcardRenderer } from "@/components/study/flashcard-renderer";
import { QuizRenderer } from "@/components/study/quiz-renderer";
import { GapRenderer } from "@/components/study/gap-renderer";
import { StudyControls } from "@/components/study/study-controls";
import { StudySummary } from "@/components/study/study-summary";

function StudyInterface() {
    const { items, currentIndex, mode, nextItem, sessionId } = useStudyStore();
    const currentItem = items[currentIndex];

    if (!currentItem) {
        return <StudySummary />;
    }

    const handleNext = async (result: any) => {
        try {
            await fetch('/api/study/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    itemId: result.itemId,
                    quality: result.quality,
                    durationMs: 1000
                })
            });
        } catch (error) {
            console.error("Failed to log progress", error);
        }

        nextItem();
    };

    return (
        <div className="flex flex-col items-center min-h-screen p-4 bg-slate-50 dark:bg-slate-950">
            <StudyHeader />

            <div className="flex-1 w-full flex flex-col items-center justify-center max-w-5xl">
                {mode === 'QUIZ' || currentItem.type === 'MC' ? (
                    <QuizRenderer item={currentItem} />
                ) : currentItem.type === 'GAP' ? (
                    <GapRenderer item={currentItem} />
                ) : (
                    <FlashcardRenderer item={currentItem} />
                )}

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
    const { language } = useSettingsStore();
    const dict = getStudyDictionary(language);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const moduleId = params.moduleId as string;
    const mode = (searchParams.get('mode') as StudyMode) || 'NORMAL';

    useEffect(() => {
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
                    throw new Error(err.error || dict.errorStarting);
                }

                const data = await res.json();

                if (data.items.length === 0) {
                    setError(dict.noItems);
                    setIsLoading(false);
                    return;
                }

                initSession(moduleId, data.items, mode, data.resumedFromIndex);
            } catch (err: any) {
                console.error(err);
                setError(err.message || dict.errorStarting);
            } finally {
                setIsLoading(false);
            }
        }

        startSession();
    }, [moduleId, mode, initSession, dict.errorStarting, dict.noItems]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">{dict.initializing}</p>
            </div>
        );
    }

    if (error) {
        const backToModuleLabel = dict.summary.backToModule;
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4 p-4 text-center">
                <AlertCircle className="h-10 w-10 text-destructive" />
                <h2 className="text-xl font-semibold">{dict.errorStarting}</h2>
                <p className="text-muted-foreground max-w-sm">{error}</p>
                <Button variant="outline" onClick={() => router.push(`/dashboard/modules/${moduleId}`)}>
                    {backToModuleLabel}
                </Button>
            </div>
        );
    }

    return <StudyInterface />;
}
