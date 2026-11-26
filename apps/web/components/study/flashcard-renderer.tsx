"use client";

import { Card } from "@/components/ui/card";
import { useStudyStore } from "@/stores/study-store";
import { useTranslation } from "@/lib/i18n/i18n";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { RichMathText } from "@/components/shared/rich-math-text";

export function FlashcardRenderer({ item }: { item: any }) {
    const { isFlipped, setIsFlipped } = useStudyStore();
    const { t } = useTranslation();

    const c = item?.content || {};
    const actualC = c.content || c;
    let frontText = actualC.question || actualC.front || actualC.text || actualC.Question || actualC.Front || actualC.term || actualC.concept;
    let backText = actualC.answer || actualC.back || actualC.Answer || actualC.Back || actualC.definition;

    if (typeof frontText === 'object') frontText = JSON.stringify(frontText);
    if (typeof backText === 'object') backText = JSON.stringify(backText);

    frontText = frontText || "Ön Yüz (Soru Metni Bulunamadı)";
    backText = backText || "Arka Yüz (Cevap Metni Bulunamadı)";

    const validImage =
        typeof actualC.image === 'string' &&
        (actualC.image.startsWith('http') || actualC.image.startsWith('data:image/'))
            ? actualC.image
            : null;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                setIsFlipped(!isFlipped);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFlipped, setIsFlipped]);

    return (
        <div
            className="w-full max-w-2xl h-[420px] cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
            style={{ perspective: '1000px' }}
        >
            <motion.div
                className="relative w-full h-full"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.55, type: "spring", stiffness: 260, damping: 22 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Front */}
                <Card
                    className="absolute w-full h-full flex flex-col items-center justify-center p-6 sm:p-8 text-center bg-[#121215] border border-white/[0.09] shadow-2xl rounded-3xl overflow-y-auto"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <div className="flex flex-col items-center gap-4 select-none w-full">
                        <span className="text-xs px-3 py-1 rounded-full bg-[#18181b] border border-white/[0.08] text-zinc-400 font-semibold">
                            {t('study.questionLabel')}
                        </span>
                        {validImage && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={validImage}
                                alt="Kart görseli"
                                className="max-h-40 w-auto max-w-full rounded-xl border border-zinc-800 bg-[#09090b] object-contain"
                            />
                        )}
                        <div className="text-xl sm:text-2xl font-bold text-zinc-100 max-w-none leading-snug">
                            <RichMathText text={String(frontText)} />
                        </div>
                        <span className="mt-4 text-xs text-zinc-500 font-mono">[{t('study.flipHint')}]</span>
                    </div>
                </Card>

                {/* Back */}
                <Card
                    className="absolute w-full h-full flex flex-col items-center justify-center p-6 sm:p-8 text-center bg-[#18181b] border border-sky-500/30 shadow-2xl rounded-3xl overflow-y-auto"
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                    }}
                >
                    <div className="flex flex-col items-center gap-4 w-full">
                        <span className="text-xs px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 font-semibold">
                            {t('study.answerLabel')}
                        </span>
                        <div className="text-xl sm:text-2xl font-bold text-zinc-100 max-w-none leading-snug">
                            <RichMathText text={String(backText)} />
                        </div>
                        {(actualC.solution || actualC.explanation) && (
                            <div className="text-zinc-300 text-sm mt-2 p-4 bg-[#121215] border border-white/[0.07] rounded-2xl w-full text-left">
                                <RichMathText text={String(actualC.solution || actualC.explanation)} />
                            </div>
                        )}
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}
