"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useStudyStore } from "@/stores/study-store";
import { CheckCircle2, Home, RotateCcw, Trophy, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getDictionary } from "@/lib/i18n/dictionaries";
import { useSettingsStore } from "@/stores/settings-store";

export function StudySummary() {
    const { correctCount, wrongCount, moduleId, endSession } = useStudyStore();
    const router = useRouter();
    const { language } = useSettingsStore();
    const dict = getDictionary(language).study.summary;

    const total = correctCount + wrongCount;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    // XP Log removed as per user request (No gamification)

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
            <Card className="w-full max-w-md p-8 text-center flex flex-col items-center gap-6 shadow-xl border-2">
                <div className="relative">
                    <div className="absolute inset-0 bg-green-400 blur-2xl opacity-10 rounded-full"></div>
                    <CheckCircle2 className="h-24 w-24 text-green-500 relative z-10 animate-bounce" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">{dict.title}</h1>
                    <p className="text-muted-foreground">{dict.subtitle}</p>
                </div>

                <div className="grid grid-cols-1 gap-4 w-full">
                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                        <div className="text-4xl font-bold text-green-600 dark:text-green-400">{accuracy}%</div>
                        <div className="text-xs text-green-600/80 uppercase font-semibold">{dict.accuracy}</div>
                    </div>
                </div>

                <div className="flex gap-8 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" /> {correctCount} {dict.correct}
                    </div>
                    <div className="flex items-center gap-2">
                        <RotateCcw className="h-4 w-4 text-red-500" /> {wrongCount} {dict.review}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full mt-4">
                    <Button variant="outline" className="h-12" onClick={() => window.location.reload()}>
                        <RotateCcw className="mr-2 h-4 w-4" /> {dict.studyAgain}
                    </Button>

                    {wrongCount > 0 ? (
                        <Button className="h-12 bg-orange-600 hover:bg-orange-700 text-white" asChild onClick={endSession}>
                            <Link href={`/study/${moduleId}?mode=WRONG_ONLY`}>
                                <AlertTriangle className="mr-2 h-4 w-4" /> {dict.reviewWrong.replace('{count}', wrongCount.toString())}
                            </Link>
                        </Button>
                    ) : (
                        <Button className="h-12" asChild onClick={endSession}>
                            <Link href={`/dashboard/modules/${moduleId}`}>
                                <Home className="mr-2 h-4 w-4" /> {dict.backToModule}
                            </Link>
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
}
