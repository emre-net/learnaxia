"use client";

import { BADGE_DEFINITIONS, type BadgeKey } from "@/lib/scoring/badges";

interface BadgeListProps {
    earnedKeys: BadgeKey[];
    allKeys?: BadgeKey[];  // Tüm rozetler gösterilsin mi (kazanılmayanlar grayed)
    size?: "sm" | "md";
    className?: string;
}

export function BadgeList({
    earnedKeys,
    allKeys,
    size = "md",
    className = "",
}: BadgeListProps) {
    const keysToShow = allKeys ?? earnedKeys;
    if (keysToShow.length === 0) return null;

    const earnedSet = new Set(earnedKeys);
    const isLg = size === "md";

    return (
        <div className={`flex flex-wrap gap-2 ${className}`}>
            {keysToShow.map(key => {
                const badge = BADGE_DEFINITIONS[key];
                if (!badge) return null;
                const earned = earnedSet.has(key);

                return (
                    <div
                        key={key}
                        title={`${badge.label} — ${badge.description}`}
                        className={`
                            group relative flex items-center gap-1.5 rounded-full px-3 py-1
                            border transition-all duration-200
                            ${earned
                                ? "border-zinc-700/80 bg-[#18181b] hover:bg-zinc-800"
                                : "border-zinc-800/60 bg-zinc-900/40 opacity-40 grayscale"
                            }
                            ${isLg ? "text-sm" : "text-xs"}
                        `}
                        style={earned ? { borderColor: `${badge.color}40` } : {}}
                    >
                        <span className={isLg ? "text-base" : "text-sm"}>
                            {badge.emoji}
                        </span>

                        <span
                            className="font-medium"
                            style={{ color: earned ? badge.color : "#a1a1aa" }}
                        >
                            {badge.label}
                        </span>

                        <div className="
                            pointer-events-none absolute bottom-full left-1/2 z-50 mb-2
                            -translate-x-1/2 whitespace-nowrap rounded-lg
                            bg-[#18181b] border border-zinc-700/80 px-3 py-2
                            text-xs text-zinc-300 opacity-0 shadow-xl
                            transition-opacity duration-150 group-hover:opacity-100
                        ">
                            {badge.description}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-[#18181b] border-r border-b border-zinc-700/80" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
