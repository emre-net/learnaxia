"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2, XCircle, Beaker, ChevronRight, BrainCircuit } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"

// Needs to match the Prisma Schema output + our API
interface PeekingQuestion {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
}

interface LearningSlide {
    id: string;
    order: number;
    title: string;
    content: string;
    peekingQuestion: any; // Actually PeekingQuestion | null
}

interface LearningJourney {
    id: string;
    title: string;
    topic?: string;
    depth?: string;
    status: string;
    syllabus: any;
    slides: LearningSlide[];
}

export function JourneyPlayer({ initialJourney }: { initialJourney: LearningJourney }) {
    const router = useRouter()

    const [journey, setJourney] = useState<LearningJourney>(initialJourney)

    // Resume from where the user left off via localStorage
    const [currentSlideIndex, setCurrentSlideIndex] = useState(() => {
        if (typeof window !== "undefined") {
            const savedIndex = localStorage.getItem(`journey_progress_${initialJourney.id}`);
            return savedIndex ? parseInt(savedIndex, 10) : 0;
        }
        return 0;
    })

    // Save progress whenever index changes
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem(`journey_progress_${journey.id}`, currentSlideIndex.toString());
        }
    }, [currentSlideIndex, journey.id]);

    // Quiz States
    const [showQuiz, setShowQuiz] = useState(false)
    const [selectedOption, setSelectedOption] = useState<string | null>(null)
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

    const totalExpectedSlides = Array.isArray(journey.syllabus) ? journey.syllabus.length : 0;
    const isGenerating = journey.status === "GENERATING";
    const currentSlide = journey.slides[currentSlideIndex];

    // Lazy Generation Orchestrator (Background sliding)
    useEffect(() => {
        if (!isGenerating) return;

        let isMounted = true;
        let isRequestPending = false;

        const generateNextSlide = async () => {
            if (isRequestPending || !isMounted) return;

            const expectedSlidesCount = Array.isArray(journey.syllabus) ? journey.syllabus.length : 0;
            const currentSlides = journey.slides || [];

            // Eğer hepsi üretilmişse tamamla
            if (currentSlides.length >= expectedSlidesCount) {
                if (expectedSlidesCount !== 0) {
                    try {
                        await fetch('/api/ai/learning-path/complete', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ journeyId: journey.id })
                        });

                        if (isMounted) {
                            setJourney(prev => ({ ...prev, status: "ACTIVE" }));
                        }
                    } catch (e) {
                        console.error("Failed to complete journey", e);
                    }
                }
                return;
            }

            // Üretilecek sıradaki slayt
            const nextItemIndex = currentSlides.length;
            const nextSyllabusItem = journey.syllabus[nextItemIndex];

            if (!nextSyllabusItem) return;

            isRequestPending = true;

            try {
                const res = await fetch('/api/ai/learning-path/generate-slide', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        journeyId: journey.id,
                        topic: journey.topic || journey.title, // DB'de topic de var, title da var.
                        depth: (journey as any).depth || "standard",
                        language: "tr", // Şimdilik varsayılan destek
                        item: nextSyllabusItem
                    })
                });

                if (res.ok) {
                    // Slayt üretildi, güncel durumu çekip state'i güncelle
                    const statusRes = await fetch(`/api/ai/learning-path/${journey.id}/status`);
                    if (statusRes.ok) {
                        const statusData = await statusRes.json();
                        if (isMounted && statusData.journey) {
                            setJourney(statusData.journey);
                        }
                    }
                } else {
                    // API hata verirse (rate limit vb) 5 saniye bekle
                    console.error("Slide generation error response", await res.text());
                    await new Promise(r => setTimeout(r, 5000));
                }
            } catch (err) {
                console.error("Generation error", err);
                await new Promise(r => setTimeout(r, 5000));
            } finally {
                isRequestPending = false;

                // Eğer halen eksik varsa döngüyü yeniden tetikle (recursive değil, useEffect dependency ile)
                // Ancak dependency'e currentSlides.length ekli olduğu için state güncellenince tekrar çalışacaktır.
                // State güncellenmemişse (örnek hata durumu) manuel tetiklemek gerek:
                if (isMounted && isGenerating) {
                    setTimeout(generateNextSlide, 1000);
                }
            }
        };

        generateNextSlide();

        return () => { isMounted = false; };
    }, [isGenerating, journey.id, journey.slides?.length]);

    const handleOptionSelect = (option: string) => {
        if (!currentSlide || !currentSlide.peekingQuestion) return;

        setSelectedOption(option);
        setIsCorrect(option === currentSlide.peekingQuestion.answer);
    }

    const handleNextSlide = () => {
        if (currentSlideIndex < journey.slides.length - 1) {
            setCurrentSlideIndex(prev => prev + 1);
            setShowQuiz(false);
            setSelectedOption(null);
            setIsCorrect(null);
        } else {
            // Journey complete
            toast({
                title: "Mükemmel İlerleyiş! 🎉",
                description: "Maceranızı başarıyla tamamladınız. Öğrendiklerinizi kütüphanenizde bulabilirsiniz.",
            });
            router.push("/dashboard/library");
        }
    }

    // Loading State (Sadece ilk slayt için bekler)
    if (isGenerating && journey.slides.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 h-full p-8 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Makinenin Motorları Isınırken...</h2>
                <p className="text-muted-foreground max-w-md">
                    İlk öğrenme slaytınız üretiliyor. Sadece birkaç saniye sürecek, hazırsanız derin bir nefes alın!
                </p>
                {totalExpectedSlides > 0 && (
                    <div className="w-full max-w-sm mt-8">
                        <Progress value={10} className="h-2 animate-pulse" />
                        <p className="text-xs text-muted-foreground mt-2">1. Adım başlatılıyor...</p>
                    </div>
                )}
            </div>
        )
    }

    // Slide Ready
    const progressPercentage = ((currentSlideIndex + 1) / totalExpectedSlides) * 100;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-950 overflow-y-auto flex flex-col">
            {/* Top Navigation Bar - Zen Header */}
            <div className="sticky top-0 z-50 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl py-3 px-4 sm:px-8 flex items-center justify-between border-b border-border/50 shadow-sm">
                <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="text-muted-foreground hover:bg-slate-200/50 dark:hover:bg-slate-800/50">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Çıkış
                </Button>

                <div className="flex-1 max-w-xl mx-4 text-center hidden sm:block">
                    <div className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400 truncate mb-2">{journey.title}</div>
                    <div className="relative h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="absolute top-0 left-0 h-full bg-indigo-500 transition-all duration-500 ease-out"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>

                <div className="text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap hidden sm:block">
                    Adım {currentSlideIndex + 1} / {totalExpectedSlides}
                </div>
            </div>

            {/* Mobile Progress */}
            <div className="sm:hidden px-4 py-3 bg-card border-b border-border/50 sticky top-[60px] z-40">
                <div className="text-xs font-semibold uppercase text-slate-500 truncate mb-2">{journey.title}</div>
                <div className="flex items-center gap-3">
                    <Progress value={progressPercentage} className="h-1.5 flex-1" />
                    <span className="text-xs font-medium text-slate-500">{currentSlideIndex + 1}/{totalExpectedSlides}</span>
                </div>
            </div>

            {currentSlide ? (
                <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 lg:py-16 animate-in fade-in slide-in-from-bottom-8 duration-700">

                    {/* Header: Slide Title */}
                    <div className="mb-10 text-center animate-in zoom-in-95 duration-500 delay-100">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold tracking-widest uppercase mb-6 ring-1 ring-indigo-500/20">
                            Adım {currentSlide.order}
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                            {currentSlide.title}
                        </h1>
                    </div>

                    {/* Content Body - Zen Typography */}
                    <div className="bg-card dark:bg-card/40 border border-border/40 shadow-2xl shadow-indigo-500/5 rounded-[2rem] p-6 sm:p-10 lg:p-16 mb-16 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                        <div
                            className="prose prose-slate dark:prose-invert prose-lg md:prose-xl max-w-none text-slate-700 dark:text-slate-300 leading-relaxed
                                prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-headings:font-bold
                                prose-h1:text-3xl prose-h1:mt-12 prose-h1:mb-6
                                prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-5 prose-h2:text-indigo-900 dark:prose-h2:text-indigo-200
                                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                                prose-p:mb-6 prose-p:leading-relaxed
                                prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
                                prose-strong:text-slate-900 dark:prose-strong:text-white
                                prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-6 prose-ul:space-y-2 prose-ul:marker:text-indigo-500
                                prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-6 prose-ol:space-y-2 prose-ol:marker:text-indigo-500 prose-ol:font-medium
                                prose-li:pl-2
                                prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:pl-6 prose-blockquote:py-2 prose-blockquote:my-8 prose-blockquote:italic prose-blockquote:text-slate-600 dark:prose-blockquote:text-slate-400 prose-blockquote:bg-indigo-50 dark:prose-blockquote:bg-indigo-500/5 prose-blockquote:rounded-r-xl
                                prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:font-mono prose-code:text-pink-600 dark:prose-code:text-pink-400
                                prose-pre:bg-slate-900 prose-pre:text-slate-50 prose-pre:p-6 prose-pre:rounded-2xl prose-pre:overflow-x-auto prose-pre:my-8 prose-pre:text-sm prose-pre:leading-relaxed prose-pre:border prose-pre:border-slate-800 shadow-xl"
                            dangerouslySetInnerHTML={{ __html: currentSlide.content }}
                        />
                    </div>

                    {/* Quiz Section Trigger Button */}
                    {currentSlide.peekingQuestion && (
                        <div className="pt-4 flex justify-center pb-20">
                            {!showQuiz ? (
                                <div className="text-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                                    <Button
                                        size="lg"
                                        className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-full px-10 py-8 text-lg font-semibold shadow-2xl shadow-indigo-500/20 group hover:scale-105 transition-all duration-300"
                                        onClick={() => {
                                            setShowQuiz(true);
                                            // Scroll slightly to reveal quiz
                                            setTimeout(() => window.scrollBy({ top: 400, behavior: 'smooth' }), 100);
                                        }}
                                    >
                                        Anladım, Kendimi Test Et
                                        <BrainCircuit className="ml-3 h-6 w-6 group-hover:rotate-12 transition-transform" />
                                    </Button>

                                    {isGenerating && currentSlideIndex === journey.slides.length - 1 && (
                                        <p className="text-xs text-muted-foreground mt-6 flex items-center justify-center">
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin text-indigo-500" /> Arka planda sıradaki slayt üretiliyor...
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <Card className={cn(
                                    "border-2 transition-colors duration-300 w-full max-w-3xl animate-in fade-in slide-in-from-bottom-8",
                                    isCorrect === true ? "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20" :
                                        isCorrect === false ? "border-red-500/50 bg-red-50/50 dark:bg-red-950/20" :
                                            "border-border drop-shadow-md"
                                )}>
                                    <CardContent className="p-6 sm:p-10 space-y-8 text-left">
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mb-2">
                                            <BrainCircuit className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-2xl font-semibold leading-relaxed text-slate-900 dark:text-white">
                                            {currentSlide.peekingQuestion.question}
                                        </h3>

                                        <div className="space-y-4">
                                            {currentSlide.peekingQuestion.options.map((opt: string, idx: number) => {
                                                const isSelected = selectedOption === opt;
                                                const isActualAnswer = opt === currentSlide.peekingQuestion.answer;

                                                let btnClass = "border-border hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-indigo-500/50";

                                                if (selectedOption) {
                                                    // Allow retrying if they got it wrong
                                                    if (isActualAnswer && isCorrect) {
                                                        btnClass = "border-emerald-500 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
                                                    } else if (isSelected && !isCorrect) {
                                                        btnClass = "border-red-500 bg-red-100 dark:bg-red-900/50 text-red-900 dark:text-red-100";
                                                    } else if (isCorrect) {
                                                        btnClass = "opacity-50 cursor-not-allowed border-border";
                                                    }
                                                }

                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => {
                                                            if (!selectedOption || !isCorrect) handleOptionSelect(opt);
                                                        }}
                                                        disabled={selectedOption !== null && isCorrect === true}
                                                        className={cn(
                                                            "w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 text-lg flex items-center gap-4",
                                                            btnClass
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 text-sm font-bold",
                                                            selectedOption ? (isActualAnswer ? "border-emerald-500 text-emerald-600" : isSelected ? "border-red-500 text-red-600" : "border-muted-foreground") : "border-muted-foreground"
                                                        )}>
                                                            {String.fromCharCode(65 + idx)}
                                                        </div>
                                                        <span className="flex-1 leading-relaxed text-slate-800 dark:text-slate-200 font-medium">{opt}</span>
                                                        {selectedOption && isActualAnswer && (
                                                            <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-500 animate-in zoom-in" />
                                                        )}
                                                        {isSelected && !isCorrect && (
                                                            <XCircle className="h-6 w-6 shrink-0 text-red-500 animate-in zoom-in" />
                                                        )}
                                                    </button>
                                                )
                                            })}
                                        </div>

                                        {selectedOption && (
                                            <div className="mt-8 pt-8 border-t border-border animate-in fade-in">
                                                <div className="font-bold text-lg mb-3 text-slate-900 dark:text-white">Durum Değerlendirmesi:</div>
                                                <p className="text-muted-foreground text-lg leading-relaxed">{currentSlide.peekingQuestion.explanation}</p>

                                                {isCorrect && (
                                                    <div className="mt-8 flex justify-end">
                                                        <Button
                                                            size="lg"
                                                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 px-8 py-6 text-lg rounded-full w-full sm:w-auto"
                                                            onClick={handleNextSlide}
                                                            disabled={isGenerating && currentSlideIndex >= journey.slides.length - 1}
                                                        >
                                                            {currentSlideIndex < totalExpectedSlides - 1 ? (
                                                                <>{isGenerating && currentSlideIndex >= journey.slides.length - 1 ? "Sıradaki Adım Üretiliyor..." : "Sıradaki Uzmanlık Adımı"} <ArrowRight className="ml-2 h-6 w-6" /></>
                                                            ) : (
                                                                <>Macerayı Başarıyla Tamamla <CheckCircle2 className="ml-2 h-6 w-6" /></>
                                                            )}
                                                        </Button>
                                                    </div>
                                                )}

                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex items-center justify-center p-12 flex-1">
                    <div className="text-center animate-in fade-in zoom-in duration-500">
                        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mx-auto mb-6" />
                        <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Motorlara Yetişiliyor...</h3>
                        <p className="text-muted-foreground">İşlem bekleniyor, lütfen ayrılmayın.</p>
                    </div>
                </div>
            )}
        </div>
    )
}
