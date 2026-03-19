"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStudyStore } from "@/stores/study-store";
import { useSettingsStore } from "@/stores/settings-store";
import { getStudyDictionary } from "@/lib/i18n/dictionaries";
import { AlertCircle, Sparkles } from "lucide-react";
import { BrandLoader } from "@/components/ui/brand-loader";
import { Button } from "@/components/ui/button";

import { StudyHeader } from "@/components/study/study-header";
import { FlashcardRenderer } from "@/components/study/flashcard-renderer";
import { QuizRenderer } from "@/components/study/quiz-renderer";
import { GapRenderer } from "@/components/study/gap-renderer";
import { StudyControls } from "@/components/study/study-controls";
import { StudySummary } from "@/components/study/study-summary";
import { Badge } from "@/components/ui/badge";

function DailyStudyInterface() {
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
                    durationMs: 1500 // Basic estimation for mixed mode
                })
            });
        } catch (error) {
            console.error("Failed to log mixed progress", error);
        }

        nextItem();
    };

    return (
        <div className="flex flex-col items-center min-h-screen p-4 bg-slate-50 dark:bg-slate-950">
            <StudyHeader />

            {/* Context Badge for Mixed Review */}
            <div className="w-full max-w-5xl flex justify-center mt-4">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300 gap-1.5 py-1 px-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    Karma Günlük Tekrar
                </Badge>
            </div>

            <div className="flex-1 w-full flex flex-col items-center justify-center max-w-5xl -mt-6">
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

export default function DailyStudyPage() {
    const router = useRouter();
    const initSession = useStudyStore(state => state.initSession);
    const { language } = useSettingsStore();
    const dict = getStudyDictionary(language);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function startSession() {
            try {
                setIsLoading(true);
                const res = await fetch('/api/study/start-daily', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
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

                initSession("DAILY_MIXED", data.items, 'SM2', data.resumedFromIndex);
            } catch (err: any) {
                console.error(err);
                setError(err.message || dict.errorStarting);
            } finally {
                setIsLoading(false);
            }
        }

        startSession();
    }, [initSession, dict.errorStarting, dict.noItems]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <BrandLoader size="lg" label="Günlük kampın hazırlanıyor..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4 p-4 text-center">
                <AlertCircle className="h-10 w-10 text-destructive" />
                <h2 className="text-xl font-semibold">Kamp Başlatılamadı</h2>
                <p className="text-muted-foreground max-w-sm">{error}</p>
                <Button variant="outline" onClick={() => router.push(`/dashboard`)}>
                    Ana Ekrana Dön
                </Button>
            </div>
        );
    }

    return <DailyStudyInterface />;
}
