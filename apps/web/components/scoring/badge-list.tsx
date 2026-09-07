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
                const earned = earnedSet.has(key);

                return (
                    <div
                        key={key}
                        title={`${badge.label} — ${badge.description}`}
                        className={`
                            group relative flex items-center gap-1.5 rounded-full px-3 py-1
                            border transition-all duration-200
                            ${earned
                                ? "border-white/10 bg-white/5 hover:bg-white/10"
                                : "border-white/5 bg-white/[0.02] opacity-35 grayscale"
                            }
                            ${isLg ? "text-sm" : "text-xs"}
                        `}
                        style={earned ? { borderColor: `${badge.color}30` } : {}}
                    >
                        {/* Emoji */}
                        <span className={isLg ? "text-base" : "text-sm"}>
                            {badge.emoji}
                        </span>

                        {/* Label */}
                        <span
                            className="font-medium"
                            style={{ color: earned ? badge.color : "#ffffff60" }}
                        >
                            {badge.label}
                        </span>

                        {/* Tooltip (hover) */}
                        <div className="
                            pointer-events-none absolute bottom-full left-1/2 z-50 mb-2
                            -translate-x-1/2 whitespace-nowrap rounded-lg
                            bg-[#1A1A2E] border border-white/10 px-3 py-2
                            text-xs text-white/70 opacity-0 shadow-xl
                            transition-opacity duration-150 group-hover:opacity-100
                        ">
                            {badge.description}
                            {/* Arrow */}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-[#1A1A2E] border-r border-b border-white/10" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
