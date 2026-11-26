"use client";

import { useTranslation } from "@/lib/i18n/i18n";
import { useStudyStore } from "@/stores/study-store";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";
import { useRef } from "react";
import ReactMarkdown from "react-markdown";
import { playStudySound } from "@/lib/audio";

export function GapRenderer({ item }: { item: any }) {
    const { setFeedback, feedback, setCorrectCount, correctCount, setWrongCount, wrongCount } = useStudyStore();
    const { t } = useTranslation();

    const [userAnswers, setUserAnswers] = useState<string[]>([]);

    const { parts, gapIndices } = useMemo(() => {
        const textToSplit = item.content?.text || item.content?.question || "";
        const splitText = textToSplit.split(/(\{\{.*?\}\})/g);
        const indices = splitText
            .map((part: string, index: number) => part.startsWith('{{') && part.endsWith('}}') ? index : -1)
            .filter((index: number) => index !== -1);
        return { parts: splitText, gapIndices: indices };
    }, [item.content?.text, item.content?.question]);

    // Initialize state when item changes
    useEffect(() => {
        setUserAnswers(new Array(gapIndices.length).fill(""));
    }, [item.id, gapIndices.length]);

    const correctAnswersList: string[] = useMemo(() => {
        if (Array.isArray(item.content?.answers) && item.content.answers.length > 0) {
            return item.content.answers;
        }
        const textToSearch = item.content?.text || item.content?.question || "";
        const matches = textToSearch.match(/\{\{(.*?)\}\}/g);
        if (matches && matches.length > 0) {
            return matches.map((m: string) => m.slice(2, -2).trim());
        }
        if (item.content?.answer) {
            return [String(item.content.answer)];
        }
        if (item.content?.gap) {
            return [String(item.content.gap)];
        }
        return [];
    }, [item.content]);

    const normalize = (s: string) => {
        return s
            .toLocaleLowerCase('tr')
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
            .replace(/\s{2,}/g, " ")
            .trim();
    };

    const checkAnswer = () => {
        // Approval Item 5: Allow checking even if some gaps are empty. 
        // We only return if ALL gaps are empty to prevent accidental clicks, 
        // but user specifically asked to check even if "one box is empty".
        if (userAnswers.every(a => !a.trim())) return;

        const correctAnswers = correctAnswersList.map(normalize);

        const results = userAnswers.map((ans, idx) => {
            const input = normalize(ans);
            const target = correctAnswers[idx]; // Assumes answers array matches gap order
            return input === target;
        });

        const allCorrect = results.every((r: boolean) => r);

        setFeedback(allCorrect ? 'CORRECT' : 'WRONG');
        playStudySound(allCorrect ? 'SUCCESS' : 'FAILURE');

        if (allCorrect) setCorrectCount(correctCount + 1);
        else setWrongCount(wrongCount + 1);
    };

    const handleInputChange = (index: number, value: string) => {
        if (feedback) return;
        const newAnswers = [...userAnswers];
        newAnswers[index] = value;
        setUserAnswers(newAnswers);
    };

    // Helper to determine gap index (0st gap, 1st gap...) from part index
    const getGapIndex = (partIndex: number) => {
        return gapIndices.indexOf(partIndex);
    };

    const inputRefs = useRef<HTMLInputElement[]>([]);

    return (
        <div className="w-full max-w-3xl flex flex-col gap-8">
            <Card className="p-8 text-center border-2 shadow-sm min-h-[300px] flex flex-col items-center justify-center gap-8">
                <div className="text-2xl font-semibold leading-loose max-w-full">
                    {parts.map((part: string, i: number) => {
                        const isGap = part.startsWith('{{') && part.endsWith('}}');

                        if (isGap) {
                            const gapIndex = getGapIndex(i);
                            const answer = userAnswers[gapIndex] || "";

                            // Determine style based on feedback
                            let borderColor = "border-input";
                            let bgColor = "bg-background";
                            let textColor = "text-foreground";

                            if (feedback) {
                                const normalizedInput = normalize(answer);
                                const normalizedTarget = normalize(correctAnswersList[gapIndex] || "");
                                const isCorrect = normalizedInput === normalizedTarget && normalizedTarget.length > 0;

                                borderColor = isCorrect ? "border-emerald-500/70" : "border-rose-500/70";
                                bgColor = isCorrect ? "bg-emerald-500/15" : "bg-rose-500/15";
                                textColor = isCorrect ? "text-emerald-300" : "text-rose-300";
                            }

                            return (
                                <span key={i} className="inline-block mx-1 align-middle">
                                    <Input
                                        ref={(el) => {
                                            if (el) inputRefs.current[gapIndex] = el;
                                        }}
                                        value={answer}
                                        onChange={(e) => handleInputChange(gapIndex, e.target.value)}
                                        className={cn(
                                            "w-32 h-10 text-center font-medium transition-all inline-flex",
                                            borderColor, bgColor, textColor,
                                            !feedback && "focus:ring-2 focus:ring-primary focus:border-primary"
                                        )}
                                        disabled={!!feedback}
                                        placeholder="?"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                // If it's the last input, check answer
                                                if (gapIndex === gapIndices.length - 1) {
                                                    checkAnswer();
                                                } else {
                                                    // Focus next gap
                                                    inputRefs.current[gapIndex + 1]?.focus();
                                                }
                                            }
                                        }}
                                    />
                                </span>
                            );
                        }

                        return (
                            <div key={i} className="inline prose dark:prose-invert prose-sm">
                                <ReactMarkdown>{part}</ReactMarkdown>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {!feedback && (
                <Button
                    className="w-full h-12 text-lg"
                    size="lg"
                    onClick={checkAnswer}
                    disabled={userAnswers.every(a => !a.trim())}
                >
                    {t('study.check')}
                </Button>
            )}

            {feedback && (
                <div className={cn(
                    "p-6 rounded-2xl text-center font-medium animate-in fade-in slide-in-from-bottom-2 border",
                    feedback === 'CORRECT'
                        ? "bg-emerald-500/12 border-emerald-500/35 text-emerald-300"
                        : "bg-rose-500/12 border-rose-500/35 text-rose-300"
                )}>
                    {feedback === 'CORRECT' ? (
                        <div className="flex flex-col gap-2 items-center">
                            <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-1" />
                            <span className="text-xl font-bold">{t('study.correct')}</span>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-center gap-2 text-xl font-bold text-rose-400">
                                <XCircle className="h-6 w-6" />
                                <span>{t('study.partialWrong')}</span>
                            </div>
                            <div className="text-sm mt-1 bg-[#121215] border border-white/[0.08] p-4 rounded-xl inline-block max-w-lg mx-auto">
                                <span className="block mb-2 font-semibold text-zinc-300">{t('study.correctAnswers')}</span>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {correctAnswersList.map((ans: string, i: number) => (
                                        <span key={i} className="px-2.5 py-1 bg-sky-500/15 rounded-lg border border-sky-500/30 text-sky-300 font-mono">
                                            {i + 1}. {ans}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
