
"use client";

import { Globe, Lock, EyeOff, LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Visibility = 'PUBLIC' | 'PRIVATE' | 'DRAFT';

interface VisibilityBadgeProps {
    visibility: Visibility | string;
    className?: string;
}

export function VisibilityBadge({ visibility, className = "" }: VisibilityBadgeProps) {
    const config: Record<string, { icon: LucideIcon; color: string; bg: string; label: string; border: string }> = {
        "PUBLIC": {
            icon: Globe,
            color: "text-indigo-600 dark:text-indigo-400",
            bg: "bg-indigo-50 dark:bg-indigo-900/20",
            border: "border-indigo-100 dark:border-indigo-900/30",
            label: "Herkese Açık"
        },
        "PRIVATE": {
            icon: Lock,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-900/20",
            border: "border-amber-100 dark:border-amber-900/30",
            label: "Sadece Linkle"
        },
        "DRAFT": {
            icon: EyeOff,
            color: "text-zinc-500",
            bg: "bg-zinc-100 dark:bg-zinc-800/50",
            border: "border-zinc-200 dark:border-zinc-700/50",
            label: "Taslak"
        }
    };

    const active = config[visibility] || config["PRIVATE"];
    const Icon = active.icon;

    return (
        <Badge
            variant="outline"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${active.bg} ${active.color} ${active.border} ${className}`}
        >
            <Icon className="h-3 w-3" strokeWidth={3} />
            {active.label}
        </Badge>
    );
}
