"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useStudyStore } from "@/stores/study-store";
import { CheckCircle2, Home, RotateCcw, Trophy, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getDictionary } from "@/lib/i18n/dictionaries";
import { useSettingsStore } from "@/stores/settings-store";
import { playStudySound } from "@/lib/audio";
import { useEffect } from "react";

export function StudySummary() {
    const { correctCount, wrongCount, moduleId, endSession, isGuest, sessionId } = useStudyStore();
    const router = useRouter();
    const { language } = useSettingsStore();
    const dict = getDictionary(language).study.summary;

    const isGuestSession = isGuest || sessionId?.startsWith('guest_') || moduleId === 'tutorial';

    useEffect(() => {
        playStudySound('SUCCESS');
    }, []);

    const total = correctCount + wrongCount;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
            <Card className="w-full max-w-lg p-8 text-center flex flex-col items-center gap-6 shadow-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-3xl">
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald-400 blur-2xl opacity-20 rounded-full"></div>
                    <CheckCircle2 className="h-20 w-20 text-emerald-500 relative z-10 animate-bounce" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                        {isGuestSession ? "Tebrikler! Deneme Turunu Tamamladın!" : dict.title}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {isGuestSession ? "Learnaxia'nın bilimsel öğrenme metodolojisini başarıyla deneyimledin." : dict.subtitle}
                    </p>
                </div>

                {/* Accuracy & Score */}
                <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                        <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{accuracy}%</div>
                        <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 uppercase font-bold tracking-wider">{dict.accuracy}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-center">
                        <div className="text-3xl font-black text-sky-600 dark:text-sky-400">+{accuracy >= 60 ? 150 : 100}</div>
                        <div className="text-[11px] text-sky-600/80 dark:text-sky-400/80 uppercase font-bold tracking-wider">Momentum</div>
                    </div>
                </div>

                <div className="flex gap-6 text-sm text-muted-foreground font-medium">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {correctCount} {dict.correct}
                    </div>
                    <div className="flex items-center gap-2">
                        <RotateCcw className="h-4 w-4 text-red-500" /> {wrongCount} {dict.review}
                    </div>
                </div>

                {/* Gamified Conversion Card for Guests */}
                {isGuestSession ? (
                    <div className="w-full p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-sky-500/10 to-indigo-500/15 border-2 border-sky-500/30 text-left space-y-3.5 shadow-inner">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                                <Trophy className="h-5 w-5" />
                            </div>
                            <div>
                                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                    150 Momentum Puanı Kazandın!
                                </span>
                                <p className="text-xs text-muted-foreground">
                                    Serini (streak) başlatmak için adım at
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            Kazandığın puanları ve tamamladığın kartları hesabına kaydetmek, günlük çalışma serini (streak) başlatmak için ücretsiz hesap oluştur.
                        </p>

                        <div className="pt-1 flex flex-col gap-2">
                            <Button 
                                size="lg" 
                                className="w-full h-11 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/25 active:scale-95 transition-all text-sm"
                                asChild
                                onClick={endSession}
                            >
                                <Link href="/login?tab=register">
                                    İlerlememi Kaydet & Ücretsiz Kaydol →
                                </Link>
                            </Button>
                            <div className="flex items-center justify-between pt-1 text-xs">
                                <button 
                                    type="button"
                                    onClick={() => window.location.reload()}
                                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-medium transition-colors"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" /> Tekrar Çalış
                                </button>
                                <Link 
                                    href="/login" 
                                    onClick={endSession}
                                    className="text-sky-500 hover:text-sky-400 font-semibold transition-colors"
                                >
                                    Zaten hesabım var, Giriş Yap
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 w-full mt-2">
                        <Button variant="outline" className="h-12 rounded-xl" onClick={() => window.location.reload()}>
                            <RotateCcw className="mr-2 h-4 w-4" /> {dict.studyAgain}
                        </Button>

                        {wrongCount > 0 ? (
                            <Button className="h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-xl" asChild onClick={endSession}>
                                <Link href={`/study/${moduleId}?mode=WRONG_ONLY`}>
                                    <AlertTriangle className="mr-2 h-4 w-4" /> {dict.reviewWrong.replace('{count}', wrongCount.toString())}
                                </Link>
                            </Button>
                        ) : (
                            <Button className="h-12 rounded-xl" asChild onClick={endSession}>
                                <Link href={`/dashboard/modules/${moduleId}`}>
                                    <Home className="mr-2 h-4 w-4" /> {dict.backToModule}
                                </Link>
                            </Button>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
}
