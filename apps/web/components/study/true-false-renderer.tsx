"use client";

import { useStudyStore } from "@/stores/study-store";
import { useTranslation } from "@/lib/i18n/i18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Check, X, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { playStudySound } from "@/lib/audio";
import { resolveTrueFalseAnswer } from "@learnaxia/shared";
import { RichMathText } from "@/components/shared/rich-math-text";

export function TrueFalseRenderer({ item }: { item: any }) {
    const {
        selectedOption,
        setSelectedOption,
        feedback,
        setFeedback,
        setCorrectCount,
        correctCount,
        setWrongCount,
        wrongCount,
    } = useStudyStore();

    const { t } = useTranslation();

    const c = item?.content || {};
    const actualC = c.content || c;

    let statementText = actualC.statement || actualC.question || actualC.Question || actualC.front || actualC.text || "";
    if (typeof statementText === "object") statementText = JSON.stringify(statementText);
    statementText = statementText || "Önerme bulunamadı";

    const imageUrl = actualC.image || actualC.imageUrl || "";
    const isTrueAnswer = useMemo(() => resolveTrueFalseAnswer(actualC), [actualC]);
    const explanation = actualC.explanation || actualC.Explanation || "";

    const handleSelect = useCallback((userChoice: boolean) => {
        if (feedback) return;

        const choiceStr = userChoice ? "True" : "False";
        setSelectedOption(choiceStr);

        const isCorrect = userChoice === isTrueAnswer;
        setFeedback(isCorrect ? "CORRECT" : "WRONG");
        playStudySound(isCorrect ? "SUCCESS" : "FAILURE");

        if (isCorrect) {
            setCorrectCount(correctCount + 1);
        } else {
            setWrongCount(wrongCount + 1);
        }
    }, [feedback, isTrueAnswer, correctCount, wrongCount, setSelectedOption, setFeedback, setCorrectCount, setWrongCount]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (feedback) return;
            const key = e.key.toLowerCase();
            if (key === "1" || key === "t" || key === "d") {
                handleSelect(true);
            } else if (key === "2" || key === "f" || key === "y") {
                handleSelect(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [feedback, handleSelect]);

    const isSelectedTrue = selectedOption === "True";
    const isSelectedFalse = selectedOption === "False";

    return (
        <div className="w-full max-w-2xl flex flex-col gap-6">
            <Card className="p-6 sm:p-8 text-center bg-[#121215] border border-white/[0.06] rounded-2xl shadow-none space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 mx-auto">
                    <HelpCircle className="h-3.5 w-3.5" />
                    Doğru mu, Yanlış mı?
                </div>
                {imageUrl && (imageUrl.startsWith("data:") || imageUrl.startsWith("http")) && (
                    <div className="relative h-56 w-full overflow-hidden rounded-xl bg-[#18181b] border border-white/[0.06]">
                        <Image unoptimized fill src={imageUrl} alt="Soru görseli" className="object-contain" />
                    </div>
                )}
                <div className="text-xl sm:text-2xl font-bold text-[#f4f4f5] leading-relaxed">
                    <RichMathText text={String(statementText)} />
                </div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
                <motion.div whileHover={!feedback ? { scale: 1.015 } : {}} whileTap={!feedback ? { scale: 0.985 } : {}}>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={!!feedback}
                        onClick={() => handleSelect(true)}
                        className={cn(
                            "w-full h-24 text-lg sm:text-xl font-bold rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-200 border bg-[#121215] border-white/[0.08] text-[#f4f4f5]",
                            !feedback && "hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-300",
                            isSelectedTrue && !feedback && "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500/10",
                            feedback && isTrueAnswer && "bg-emerald-500/15 hover:bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
                            feedback && isSelectedTrue && !isTrueAnswer && "bg-rose-500/15 hover:bg-rose-500/15 text-rose-300 border-rose-500/40",
                            feedback && !isSelectedTrue && !isTrueAnswer && "opacity-40"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <Check className="h-5 w-5 stroke-[3]" />
                            <span>{t("study.true")}</span>
                        </div>
                        <span className="text-xs font-mono text-zinc-400">
                            Kısayol: [D] veya [1]
                        </span>
                    </Button>
                </motion.div>

                <motion.div whileHover={!feedback ? { scale: 1.015 } : {}} whileTap={!feedback ? { scale: 0.985 } : {}}>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={!!feedback}
                        onClick={() => handleSelect(false)}
                        className={cn(
                            "w-full h-24 text-lg sm:text-xl font-bold rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-200 border bg-[#121215] border-white/[0.08] text-[#f4f4f5]",
                            !feedback && "hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-300",
                            isSelectedFalse && !feedback && "ring-2 ring-rose-500 border-rose-500 bg-rose-500/10",
                            feedback && !isTrueAnswer && "bg-emerald-500/15 hover:bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
                            feedback && isSelectedFalse && isTrueAnswer && "bg-rose-500/15 hover:bg-rose-500/15 text-rose-300 border-rose-500/40",
                            feedback && !isSelectedFalse && isTrueAnswer && "opacity-40"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <X className="h-5 w-5 stroke-[3]" />
                            <span>{t("study.false")}</span>
                        </div>
                        <span className="text-xs font-mono text-zinc-400">
                            Kısayol: [Y] veya [2]
                        </span>
                    </Button>
                </motion.div>
            </div>

            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className={cn(
                            "p-5 rounded-2xl text-center font-semibold text-base border",
                            feedback === "CORRECT"
                                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                                : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                        )}
                    >
                        <div className="flex flex-col items-center justify-center gap-2">
                            <div className="flex items-center gap-2.5 text-lg font-bold">
                                {feedback === "CORRECT" ? (
                                    <>
                                        <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
                                        <span>{t("study.correct")}</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-6 w-6 text-rose-400 shrink-0" />
                                        <span>
                                            {t("study.wrong", {
                                                answer: isTrueAnswer ? t("study.true") : t("study.false"),
                                            })}
                                        </span>
                                    </>
                                )}
                            </div>
                            {explanation && (
                                <div className="text-sm font-normal text-zinc-300 mt-1 max-w-lg">
                                    <RichMathText text={String(explanation)} compact />
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
