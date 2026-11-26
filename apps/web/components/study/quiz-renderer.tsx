"use client";

import { useStudyStore } from "@/stores/study-store";
import { useTranslation } from "@/lib/i18n/i18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo } from "react";
import Image from "next/image";
import { playStudySound } from "@/lib/audio";
import { RichMathText } from "@/components/shared/rich-math-text";

export function QuizRenderer({ item }: { item: any }) {
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
    let questionText = actualC.question || actualC.Question || actualC.front || actualC.text || actualC.Text || "";
    let answerText = actualC.answer || actualC.Answer || actualC.correct || actualC.Correct || actualC.back || "";
    const imageUrl = actualC.image || actualC.imageUrl || "";

    if (typeof questionText === "object") questionText = JSON.stringify(questionText);
    if (typeof answerText === "object") answerText = JSON.stringify(answerText);

    questionText = questionText || "Soru metni bulunamadı";
    answerText = answerText || "Cevap bulunamadı";

    const options = useMemo(() => {
        const rawOptions = actualC.options || actualC.Options || [];
        return Array.isArray(rawOptions) ? rawOptions : Object.values(rawOptions);
    }, [actualC.options, actualC.Options]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (feedback) return;
            const index = parseInt(e.key, 10) - 1;
            if (!isNaN(index) && index >= 0 && index < options.length) {
                const chosen = String(options[index]);
                const isCorrect = chosen === String(answerText);
                setSelectedOption(chosen);
                setFeedback(isCorrect ? "CORRECT" : "WRONG");
                playStudySound(isCorrect ? "SUCCESS" : "FAILURE");
                if (isCorrect) setCorrectCount(correctCount + 1);
                else setWrongCount(wrongCount + 1);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [options, answerText, feedback, correctCount, wrongCount, setSelectedOption, setFeedback, setCorrectCount, setWrongCount]);

    return (
        <div className="w-full max-w-2xl flex flex-col gap-6">
            <Card className="p-6 sm:p-8 text-center bg-[#121215] border border-white/[0.06] rounded-2xl shadow-none space-y-5">
                {imageUrl && (imageUrl.startsWith("data:") || imageUrl.startsWith("http")) && (
                    <div className="relative h-56 w-full overflow-hidden rounded-xl bg-[#18181b] border border-white/[0.06]">
                        <Image unoptimized fill src={imageUrl} alt="Soru görseli" className="object-contain" />
                    </div>
                )}
                <div className="text-xl sm:text-2xl font-bold text-[#f4f4f5] leading-relaxed">
                    <RichMathText text={String(questionText)} />
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {options.map((option: any, idx: number) => {
                    const optText = String(option);
                    const isSelected = selectedOption === optText;
                    const isCorrect = optText === String(answerText);

                    const displayOpt =
                        item.type === "TRUE_FALSE" || item.type === "TF"
                            ? optText === "True"
                                ? t("study.true")
                                : optText === "False"
                                    ? t("study.false")
                                    : optText
                            : optText;

                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full h-auto min-h-[4.25rem] py-4 text-base justify-start px-5 relative transition-all duration-200 rounded-xl bg-[#121215] border-white/[0.08] text-[#f4f4f5] hover:bg-[#18181b] hover:border-sky-500/40 whitespace-normal",
                                    isSelected && !feedback && "ring-2 ring-sky-500 border-sky-500/60 bg-[#18181b]",
                                    feedback && isCorrect && "bg-emerald-500/15 hover:bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
                                    feedback && isSelected && !isCorrect && "bg-rose-500/15 hover:bg-rose-500/15 text-rose-300 border-rose-500/40",
                                    feedback && !isSelected && !isCorrect && "opacity-45"
                                )}
                                onClick={() => {
                                    if (feedback) return;
                                    setSelectedOption(optText);
                                    setFeedback(isCorrect ? "CORRECT" : "WRONG");
                                    playStudySound(isCorrect ? "SUCCESS" : "FAILURE");
                                    if (isCorrect) setCorrectCount(correctCount + 1);
                                    else setWrongCount(wrongCount + 1);
                                }}
                                disabled={!!feedback}
                            >
                                <span className="mr-3.5 text-xs font-mono text-zinc-400 bg-[#18181b] border border-white/[0.08] rounded-md w-6 h-6 flex items-center justify-center shrink-0">
                                    {idx + 1}
                                </span>
                                <div className="mr-6 text-left flex-1">
                                    <RichMathText text={displayOpt} compact />
                                </div>
                                {feedback && isCorrect && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-4">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                    </motion.div>
                                )}
                                {feedback && isSelected && !isCorrect && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-4">
                                        <XCircle className="h-5 w-5 text-rose-400" />
                                    </motion.div>
                                )}
                            </Button>
                        </motion.div>
                    );
                })}
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
                        <div className="flex items-center justify-center gap-3">
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
                                            answer:
                                                String(answerText) === "True" || String(answerText) === "False"
                                                    ? t(`study.${String(answerText).toLowerCase()}`)
                                                    : String(answerText),
                                        })}
                                    </span>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
