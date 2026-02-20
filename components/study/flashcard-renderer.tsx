"use client";

import { Card } from "@/components/ui/card";
import { useStudyStore } from "@/stores/study-store";
import { useTranslation } from "@/lib/i18n/i18n";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect } from "react";
import ReactMarkdown from "react-markdown";

export function FlashcardRenderer({ item }: { item: any }) {
    const { isFlipped, setIsFlipped } = useStudyStore();
    const { t } = useTranslation();

    // Keyboard Shortcuts
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
            className="w-full max-w-2xl h-[400px] cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
            style={{ perspective: '1000px' }}
        >
            <motion.div
                className="relative w-full h-full"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Front */}
                <Card
                    className="absolute w-full h-full flex flex-col items-center justify-center p-8 text-center bg-background border-2 shadow-xl hover:shadow-2xl transition-shadow"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <div className="flex flex-col gap-4 select-none">
                        <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">{t('study.questionLabel')}</span>
                        <div className="text-3xl font-bold prose dark:prose-invert max-w-none">
                            <ReactMarkdown>{item.content.question || item.content.front}</ReactMarkdown>
                        </div>
                        {item.content.image && (
                            <div className="h-40 w-full bg-muted rounded-md flex items-center justify-center">Image</div>
                        )}
                        <span className="mt-8 text-xs text-muted-foreground font-mono">[{t('study.flipHint')}]</span>
                    </div>
                </Card>

                {/* Back */}
                <Card
                    className="absolute w-full h-full flex flex-col items-center justify-center p-8 text-center bg-secondary/10 border-2 border-primary/20 shadow-xl"
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                    }}
                >
                    <div className="flex flex-col gap-4">
                        <span className="text-sm text-primary uppercase tracking-wider font-semibold">{t('study.answerLabel')}</span>
                        <div className="text-3xl font-bold text-primary prose dark:prose-invert prose-primary max-w-none">
                            <ReactMarkdown>{item.content.answer || item.content.back}</ReactMarkdown>
                        </div>
                        {item.content.solution && (
                            <div className="text-muted-foreground text-sm mt-4 p-4 bg-background/50 rounded-lg prose dark:prose-invert prose-sm max-w-none">
                                <ReactMarkdown>{item.content.solution}</ReactMarkdown>
                            </div>
                        )}
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}
