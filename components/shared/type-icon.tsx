"use client";

import { CreditCard, Brain, Layers, ListChecks, HelpCircle, LucideIcon, BookCopy, FileText } from "lucide-react";

export type ModuleType = 'FLASHCARD' | 'MC' | 'GAP' | 'TRUE_FALSE' | 'COLLECTION' | 'NOTE';

interface TypeIconProps {
    type: ModuleType | string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function TypeIcon({ type, className = "", size = 'md' }: TypeIconProps) {
    const config: Record<string, { icon: LucideIcon; color: string; bg: string; label: string }> = {
        "FLASHCARD": {
            icon: CreditCard,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-900/20",
            label: "Flashcard"
        },
        "MC": {
            icon: ListChecks,
            color: "text-purple-600 dark:text-purple-400",
            bg: "bg-purple-50 dark:bg-purple-900/20",
            label: "Çoktan Seçmeli"
        },
        "GAP": {
            icon: Brain,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-900/20",
            label: "Boşluk Doldurma"
        },
        "TRUE_FALSE": {
            icon: HelpCircle,
            color: "text-orange-600 dark:text-orange-400",
            bg: "bg-orange-50 dark:bg-orange-900/20",
            label: "Doğru/Yanlış"
        },
        "COLLECTION": {
            icon: BookCopy,
            color: "text-indigo-600 dark:text-indigo-400",
            bg: "bg-indigo-50 dark:bg-indigo-900/20",
            label: "Koleksiyon"
        },
        "NOTE": {
            icon: FileText,
            color: "text-rose-600 dark:text-rose-400",
            bg: "bg-rose-50 dark:bg-rose-900/20",
            label: "Not Defteri"
        }
    };

    const active = config[type] || { icon: Layers, color: "text-zinc-600", bg: "bg-zinc-50", label: "Modül" };
    const Icon = active.icon;

    const sizeClasses = {
        sm: "h-8 w-8 rounded-lg p-1.5",
        md: "h-11 w-11 rounded-xl p-2.5",
        lg: "h-14 w-14 rounded-2xl p-3.5"
    };

    return (
        <div className={`${sizeClasses[size]} ${active.bg} flex items-center justify-center border border-white/20 dark:border-white/5 shadow-sm ${className}`} title={active.label}>
            <Icon className={`w-full h-full ${active.color}`} strokeWidth={2.5} />
        </div>
    );
}

export function getModuleTypeLabel(type: string) {
    const labels: Record<string, string> = {
        "FLASHCARD": "Flashcard",
        "MC": "Çoktan Seçmeli",
        "GAP": "Boşluk Doldurma",
        "TRUE_FALSE": "Doğru/Yanlış",
        "COLLECTION": "Koleksiyon",
        "NOTE": "Not Defteri"
    };
    return labels[type] || "Modül";
}
