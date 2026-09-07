"use client";

import { TIERS, getTierProgress, getPointsToNextTier, type Tier } from "@/lib/scoring/tiers";

interface TierBadgeProps {
    tierKey: string;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
    showProgress?: boolean;
    score?: number;
    className?: string;
}

const SIZE_CLASSES = {
    sm: { container: "gap-1", emoji: "text-base", label: "text-xs", ring: "w-8 h-8 text-sm" },
    md: { container: "gap-1.5", emoji: "text-xl", label: "text-sm", ring: "w-11 h-11 text-lg" },
    lg: { container: "gap-2", emoji: "text-3xl", label: "text-base", ring: "w-16 h-16 text-3xl" },
};

export function TierBadge({
    tierKey,
    size = "md",
    showLabel = false,
    showProgress = false,
    score,
    className = "",
}: TierBadgeProps) {
    const tier = TIERS.find(t => t.key === tierKey) ?? TIERS[0];
    const sizes = SIZE_CLASSES[size];
    const progress = score != null ? getTierProgress(score) : null;
    const pointsToNext = score != null ? getPointsToNextTier(score) : null;

    return (
        <div className={`flex flex-col items-center ${sizes.container} ${className}`}>
            {/* Rozet çemberi */}
            <div
                className={`relative flex items-center justify-center rounded-full ${sizes.ring}`}
                style={{
                    background: `conic-gradient(${tier.gradientFrom} 0%, ${tier.gradientTo} 100%)`,
                    padding: 2,
                    boxShadow: `0 0 12px ${tier.color}40`,
                }}
            >
                <div className="flex items-center justify-center w-full h-full rounded-full bg-[#0E0E14]">
                    <span className={sizes.emoji}>{tier.emoji}</span>
                </div>

                {/* Progress ring (sadece score verilmişse) */}
                {showProgress && progress != null && (
                    <svg
                        className="absolute inset-0 w-full h-full -rotate-90"
                        viewBox="0 0 36 36"
                    >
                        <circle
                            cx="18" cy="18" r="16"
                            fill="none"
                            stroke={tier.color}
                            strokeWidth="2.5"
                            strokeDasharray={`${(progress / 100) * 100} 100`}
                            strokeLinecap="round"
                            opacity={0.8}
                        />
                    </svg>
                )}
            </div>

            {/* Tier label */}
            {showLabel && (
                <span
                    className={`font-semibold ${sizes.label}`}
                    style={{ color: tier.color }}
                >
                    {tier.label}
                </span>
            )}

            {/* Sonraki tier */}
            {showProgress && pointsToNext != null && size === "lg" && (
                <span className="text-xs text-white/40">
                    {pointsToNext.toLocaleString("tr-TR")} kaldı
                </span>
            )}
        </div>
    );
}
