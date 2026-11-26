"use client";

import { CreditCard, Brain, Layers, ListChecks, HelpCircle, LucideIcon, BookCopy, FileText } from "lucide-react";
import { Language } from "@/lib/i18n/dictionaries";
import { t as translate } from "@/lib/i18n/i18n";
import { useSettingsStore } from "@/stores/settings-store";

export type ModuleType = "FLASHCARD" | "MC" | "GAP" | "TRUE_FALSE" | "COLLECTION" | "NOTE";

interface TypeIconProps {
    type: ModuleType | string;
    className?: string;
    size?: "sm" | "md" | "lg";
}

export function TypeIcon({ type, className = "", size = "md" }: TypeIconProps) {
    const { language } = useSettingsStore();

    const config: Record<string, { icon: LucideIcon; color: string; bg: string; label: string }> = {
        FLASHCARD: {
            icon: CreditCard,
            color: "text-sky-400",
            bg: "bg-sky-500/10",
            label: "Flashcard",
        },
        MC: {
            icon: ListChecks,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            label: "Çoktan Seçmeli",
        },
        GAP: {
            icon: Brain,
            color: "text-cyan-400",
            bg: "bg-cyan-500/10",
            label: "Boşluk Doldurma",
        },
        TRUE_FALSE: {
            icon: HelpCircle,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            label: "Doğru/Yanlış",
        },
        COLLECTION: {
            icon: BookCopy,
            color: "text-indigo-400",
            bg: "bg-indigo-500/10",
            label: "Koleksiyon",
        },
        NOTE: {
            icon: FileText,
            color: "text-rose-400",
            bg: "bg-rose-500/10",
            label: translate("creation.collection.note", language) || "Not Defteri",
        },
    };

    const active = config[type] || {
        icon: Layers,
        color: "text-zinc-400",
        bg: "bg-[#18181b]",
        label: translate("library.tabs.modules", language),
    };
    const Icon = active.icon;

    const sizeClasses = {
        sm: "h-8 w-8 rounded-xl p-1.5",
        md: "h-12 w-12 rounded-2xl p-2.5",
        lg: "h-16 w-16 rounded-2xl p-3.5",
    };

    return (
        <div
            className={`${sizeClasses[size]} ${active.bg} relative overflow-hidden flex items-center justify-center border border-white/[0.08] ${className}`}
            title={active.label}
        >
            <Icon className={`w-full h-full relative z-10 ${active.color}`} strokeWidth={2.25} />
        </div>
    );
}

export function getModuleTypeLabel(type: string, language: Language = "tr") {
    const labels: Record<string, string> = {
        FLASHCARD: translate("creation.flashcardsLabel", language),
        MC: translate("creation.mcLabel", language),
        GAP: translate("creation.gapLabel", language),
        TRUE_FALSE: translate("creation.tfLabel", language),
        COLLECTION: translate("creation.collection.newTitle", language),
        NOTE: translate("library.tabs.notes", language),
    };
    return labels[type] || translate("library.tabs.modules", language);
}
