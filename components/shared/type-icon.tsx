
"use client";

import { BookCopy, Brain, Layers, ListChecks, HelpCircle } from "lucide-react";

export type ModuleType = 'FLASHCARD' | 'MC' | 'GAP' | 'TRUE_FALSE';

interface TypeIconProps {
    type: ModuleType | string;
    className?: string;
}

export function TypeIcon({ type, className = "" }: TypeIconProps) {
    switch (type) {
        case "FLASHCARD":
            return <BookCopy className={className} />;
        case "MC":
            return <ListChecks className={className} />;
        case "GAP":
            return <Brain className={className} />;
        case "TRUE_FALSE":
            return <HelpCircle className={className} />;
        default:
            return <Layers className={className} />;
    }
}

export function getModuleTypeLabel(type: string) {
    switch (type) {
        case "FLASHCARD": return "Flashcard";
        case "MC": return "Çoktan Seçmeli";
        case "GAP": return "Boşluk Doldurma";
        case "TRUE_FALSE": return "Doğru/Yanlış";
        default: return "Modül";
    }
}
