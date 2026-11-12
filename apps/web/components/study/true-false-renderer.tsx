"use client";

import { useStudyStore } from "@/stores/study-store";
import { useTranslation } from "@/lib/i18n/i18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Check, X, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { playStudySound } from "@/lib/audio";

export function TrueFalseRenderer({ item }: { item: any }) {
    const {
        selectedOption,
        setSelectedOption,
        feedback,
        setFeedback,
        setCorrectCount,
        correctCount,
        setWrongCount,
        wrongCount
    } = useStudyStore();

    const { t } = useTranslation();

    const c = item?.content || {};
    const actualC = c.content || c;

    // Extract statement
    let statementText = actualC.statement || actualC.question || actualC.Question || actualC.front || actualC.text || "";
    if (typeof statementText === 'object') statementText = JSON.stringify(statementText);
    statementText = statementText || "🤔 Önerme Bulunamadı";

    // Extract correct boolean value
    const isTrueAnswer = useMemo(() => {
        if (typeof actualC.isTrue === 'boolean') return actualC.isTrue;
        if (typeof actualC.isTrue === 'string') return actualC.isTrue.toLowerCase() === 'true';
        if (typeof actualC.answer === 'boolean') return actualC.answer;
        if (typeof actualC.answer === 'string') return actualC.answer.toLowerCase() === 'true';
        if (typeof actualC.correctAnswer === 'boolean') return actualC.correctAnswer;
        if (typeof actualC.correctAnswer === 'string') return actualC.correctAnswer.toLowerCase() === 'true';
        return true;
    }, [actualC]);

    const explanation = actualC.explanation || actualC.Explanation || "";

    const handleSelect = (userChoice: boolean) => {
        if (feedback) return;

        const choiceStr = userChoice ? "True" : "False";
        setSelectedOption(choiceStr);

        const isCorrect = userChoice === isTrueAnswer;
        setFeedback(isCorrect ? 'CORRECT' : 'WRONG');
        playStudySound(isCorrect ? 'SUCCESS' : 'FAILURE');

        if (isCorrect) {
            setCorrectCount(correctCount + 1);
        } else {
            setWrongCount(wrongCount + 1);
        }
    };

    // Keyboard support: 1/T/D for True, 2/F/Y for False
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (feedback) return;
            const key = e.key.toLowerCase();
            if (key === '1' || key === 't' || key === 'd') {
                handleSelect(true);
            } else if (key === '2' || key === 'f' || key === 'y') {
                handleSelect(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [feedback, isTrueAnswer]);

    const isSelectedTrue = selectedOption === "True";
    const isSelectedFalse = selectedOption === "False";

    return (
        <div className="w-full max-w-2xl flex flex-col gap-6">
            {/* Önerme Kartı */}
            <Card className="p-8 text-center border-2 shadow-sm bg-card/60 backdrop-blur-sm">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary mb-6">
                    <HelpCircle className="h-3.5 w-3.5" />
                    Doğru mu, Yanlış mı?
                </div>
                <div className="text-2xl md:text-3xl font-bold tracking-tight text-foreground prose dark:prose-invert max-w-none leading-relaxed">
                    <ReactMarkdown>{String(statementText)}</ReactMarkdown>
                </div>
            </Card>

            {/* İkili Seçenek Butonları */}
            <div className="grid grid-cols-2 gap-4">
                {/* DOĞRU BUTONU */}
                <motion.div
                    whileHover={!feedback ? { scale: 1.02 } : {}}
                    whileTap={!feedback ? { scale: 0.98 } : {}}
                >
                    <Button
                        type="button"
                        variant="outline"
                        disabled={!!feedback}
                        onClick={() => handleSelect(true)}
                        className={cn(
                            "w-full h-24 text-xl font-bold rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 border-2",
                            !feedback && "hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400",
                            isSelectedTrue && !feedback && "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500/10",
                            feedback && isTrueAnswer && "bg-emerald-600 hover:bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20",
                            feedback && isSelectedTrue && !isTrueAnswer && "bg-rose-600 hover:bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-500/20",
                            feedback && !isSelectedTrue && !isTrueAnswer && "opacity-40"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <Check className="h-6 w-6 stroke-[3]" />
                            <span>{t('study.true')}</span>
                        </div>
                        <span className="text-[11px] font-mono font-medium opacity-60 uppercase tracking-wider">
                            Kısayol: [D] veya [1]
                        </span>
                    </Button>
                </motion.div>

                {/* YANLIŞ BUTONU */}
                <motion.div
                    whileHover={!feedback ? { scale: 1.02 } : {}}
                    whileTap={!feedback ? { scale: 0.98 } : {}}
                >
                    <Button
                        type="button"
                        variant="outline"
                        disabled={!!feedback}
                        onClick={() => handleSelect(false)}
                        className={cn(
                            "w-full h-24 text-xl font-bold rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 border-2",
                            !feedback && "hover:border-rose-500 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400",
                            isSelectedFalse && !feedback && "ring-2 ring-rose-500 border-rose-500 bg-rose-500/10",
                            feedback && !isTrueAnswer && "bg-emerald-600 hover:bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20",
                            feedback && isSelectedFalse && isTrueAnswer && "bg-rose-600 hover:bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-500/20",
                            feedback && !isSelectedFalse && isTrueAnswer && "opacity-40"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <X className="h-6 w-6 stroke-[3]" />
                            <span>{t('study.false')}</span>
                        </div>
                        <span className="text-[11px] font-mono font-medium opacity-60 uppercase tracking-wider">
                            Kısayol: [Y] veya [2]
                        </span>
                    </Button>
                </motion.div>
            </div>

            {/* Geribildirim ve Açıklama Alanı */}
            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className={cn(
                            "p-6 rounded-2xl text-center font-semibold text-base shadow-lg border-2",
                            feedback === 'CORRECT'
                                ? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                : "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                        )}
                    >
                        <div className="flex items-center justify-center gap-2.5 text-lg font-bold mb-2">
                            {feedback === 'CORRECT' ? (
                                <>
                                    <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                    <span>Tebrikler, Doğru Cevap!</span>
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                                    <span>
                                        Yanlış! Doğru cevap: <span className="underline">{isTrueAnswer ? t('study.true') : t('study.false')}</span> olmalıydı.
                                    </span>
                                </>
                            )}
                        </div>

                        {explanation && (
                            <p className="mt-3 text-sm text-muted-foreground/90 font-normal leading-relaxed text-left bg-background/50 p-3.5 rounded-xl border">
                                <span className="font-semibold text-foreground block mb-1">Açıklama:</span>
                                {explanation}
                            </p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

