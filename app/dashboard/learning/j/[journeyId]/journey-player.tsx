"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, CheckCircle2, XCircle, Beaker, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

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

    // Polling logic
    useEffect(() => {
        if (!isGenerating) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/ai/learning-path/${journey.id}/status`);
                const data = await res.json();

                if (res.ok && data.journey) {
                    setJourney(data.journey);
                }
            } catch (err) {
                console.error("Failed to poll journey status", err);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [isGenerating, journey.id]);

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
            alert("Journey Complete! Returning to dashboard...");
            router.push("/dashboard");
        }
    }

    // Loading State
    if (isGenerating && journey.slides.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 h-full p-8 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Preparing your Journey...</h2>
                <p className="text-muted-foreground max-w-md">
                    We are crafting personalized interactive slides based on your syllabus. This typically takes about 1-2 minutes.
                </p>
                {totalExpectedSlides > 0 && (
                    <div className="w-full max-w-sm mt-8">
                        <Progress value={0} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-2">Generating 0 of {totalExpectedSlides} slides</p>
                    </div>
                )}
            </div>
        )
    }

    // Slide Ready
    const progressPercentage = ((currentSlideIndex + 1) / totalExpectedSlides) * 100;

    return (
        <div className="flex flex-col flex-1 h-full max-w-4xl mx-auto w-full px-4 sm:px-6 pb-20 relative">

            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-10 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md py-4 mb-6 flex items-center justify-between border-b border-border">
                <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="text-muted-foreground">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Exit
                </Button>

                <div className="flex-1 max-w-sm mx-4 text-center hidden sm:block">
                    <div className="text-sm font-semibold truncate">{journey.title}</div>
                    <Progress value={progressPercentage} className="h-1.5 mt-2" />
                </div>

                <div className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                    {currentSlideIndex + 1} / {totalExpectedSlides}
                </div>
            </div>

            {/* Mobile Progress */}
            <div className="sm:hidden mb-6">
                <div className="text-sm font-semibold truncate mb-2">{journey.title}</div>
                <Progress value={progressPercentage} className="h-1.5" />
            </div>

            {currentSlide ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                    {/* Slide Content */}
                    <Card className="border-indigo-500/20 shadow-lg bg-card overflow-hidden">
                        <div className="h-2 w-full bg-gradient-to-r from-indigo-500 to-emerald-500" />
                        <CardContent className="p-6 sm:p-10">
                            <h1 className="text-3xl font-bold tracking-tight mb-6">{currentSlide.title}</h1>

                            <div
                                className="prose prose-slate dark:prose-invert max-w-none text-lg leading-relaxed
                                    prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-indigo-600 dark:prose-h2:text-indigo-400
                                    prose-p:mb-4 prose-li:mb-2 prose-ul:list-disc prose-ul:pl-6"
                                dangerouslySetInnerHTML={{ __html: currentSlide.content }}
                            />
                        </CardContent>
                    </Card>

                    {/* Quiz Section */}
                    {currentSlide.peekingQuestion && (
                        <div className="pt-4">
                            {!showQuiz ? (
                                <div className="text-center">
                                    <Button
                                        size="lg"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8"
                                        onClick={() => setShowQuiz(true)}
                                    >
                                        <Beaker className="mr-2 h-5 w-5" />
                                        Test Your Understanding
                                    </Button>
                                    {isGenerating && currentSlideIndex === journey.slides.length - 1 && (
                                        <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center">
                                            <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Generating next slide...
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <Card className={cn(
                                    "border-2 transition-colors duration-300",
                                    isCorrect === true ? "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20" :
                                        isCorrect === false ? "border-red-500/50 bg-red-50/50 dark:bg-red-950/20" :
                                            "border-border drop-shadow-md"
                                )}>
                                    <CardContent className="p-6 sm:p-8 space-y-6">
                                        <h3 className="text-xl font-semibold">
                                            {currentSlide.peekingQuestion.question}
                                        </h3>

                                        <div className="space-y-3">
                                            {currentSlide.peekingQuestion.options.map((opt: string, idx: number) => {
                                                const isSelected = selectedOption === opt;
                                                const isActualAnswer = opt === currentSlide.peekingQuestion.answer;

                                                let btnClass = "border-border hover:bg-slate-100 dark:hover:bg-slate-800";

                                                if (selectedOption) {
                                                    // Allow retrying if they got it wrong
                                                    if (isActualAnswer && isCorrect) {
                                                        btnClass = "border-emerald-500 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-100";
                                                    } else if (isSelected && !isCorrect) {
                                                        btnClass = "border-red-500 bg-red-100 dark:bg-red-900/50 text-red-900 dark:text-red-100";
                                                    } else if (isCorrect) {
                                                        btnClass = "opacity-50 cursor-not-allowed";
                                                    }
                                                }

                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => (!selectedOption || !isCorrect) && handleOptionSelect(opt)}
                                                        className={cn(
                                                            "p-4 rounded-xl border-2 cursor-pointer transition-all",
                                                            btnClass
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-medium">{opt}</span>
                                                            {selectedOption && isActualAnswer && (
                                                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                            )}
                                                            {isSelected && !isCorrect && (
                                                                <XCircle className="h-5 w-5 text-red-500" />
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        {selectedOption && (
                                            <div className="mt-6 p-4 rounded-lg bg-background border border-border animate-in fade-in">
                                                <div className="font-semibold mb-1">Explanation:</div>
                                                <p className="text-muted-foreground">{currentSlide.peekingQuestion.explanation}</p>

                                                {isCorrect && (
                                                    <div className="mt-6 flex justify-end">
                                                        <Button
                                                            size="lg"
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                            onClick={handleNextSlide}
                                                            disabled={isGenerating && currentSlideIndex >= journey.slides.length - 1}
                                                        >
                                                            {currentSlideIndex < totalExpectedSlides - 1 ? (
                                                                <>Next Slide <ChevronRight className="ml-2 h-5 w-5" /></>
                                                            ) : (
                                                                <>Complete Journey <CheckCircle2 className="ml-2 h-5 w-5" /></>
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
                <div className="flex items-center justify-center p-12">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Catching up with AI generator...</p>
                    </div>
                </div>
            )}
        </div>
    )
}
