"use client";

import { useEffect, useState } from "react";
import { TierBadge } from "./tier-badge";
import { BadgeList } from "./badge-list";
import { getTierForScore } from "@/lib/scoring/tiers";
import type { BadgeKey } from "@/lib/scoring/badges";

interface ScoreData {
    momentum: { thisMonth: number; allTime: number };
    tier: {
        thisMonth: { key: string; label: string; emoji: string; color: string; progress: number; pointsToNext: number | null };
        allTime: { key: string; label: string; emoji: string; color: string; progress: number; pointsToNext: number | null };
    };
    badges: Array<{ key: BadgeKey; label: string; description: string; emoji: string; color: string }>;
    metrics: {
        studyMinutes: number;
        cardsReviewed: number;
        accuracyRate: number;
        modulesCreated: number;
        journeyCompletions: number;
        activeDays: number;
        contentAdoption: number;
    };
    period: string;
}

function formatMomentum(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString("tr-TR");
}

function MetricItem({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-lg font-bold text-white">{value}</span>
            <span className="text-xs text-white/40">{label}</span>
            {sub && <span className="text-xs text-white/25">{sub}</span>}
        </div>
    );
}

export function ScoreCard({ compact = false }: { compact?: boolean }) {
    const [data, setData] = useState<ScoreData | null>(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"thisMonth" | "allTime">("thisMonth");

    useEffect(() => {
        fetch("/api/scores/me")
            .then(r => r.ok ? r.json() : null)
            .then(d => {
                if (d && d.tier && d.momentum) {
                    setData(d);
                }
            })
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 animate-pulse">
                <div className="h-20 w-full rounded-xl bg-white/5" />
            </div>
        );
    }

    if (!data || !data.tier || !data.tier[view] || !data.momentum) return null;

    const tier = data.tier[view];
    const momentum = view === "thisMonth" ? (data.momentum.thisMonth ?? 0) : (data.momentum.allTime ?? 0);
    const tierObj = getTierForScore(momentum);

    if (compact) {
        return (
            <div
                className="flex items-center gap-3 rounded-xl border border-white/5 px-4 py-3 bg-white/[0.03]"
                style={{ borderColor: `${tierObj.color}20` }}
            >
                <TierBadge tierKey={tier.key} size="sm" />
                <div>
                    <div className="text-sm font-bold text-white">
                        {formatMomentum(momentum)}{" "}
                        <span className="text-xs font-normal text-white/40">Momentum</span>
                    </div>
                    <div className="text-xs" style={{ color: tierObj.color }}>
                        {tier.label}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="relative overflow-hidden rounded-2xl border p-5 sm:p-6 bg-[#121215]"
            style={{
                borderColor: `${tierObj.color}28`,
                background: `radial-gradient(ellipse at top left, ${tierObj.color}0C 0%, transparent 60%), #121215`,
            }}
        >
            {/* Arka plan glow */}
            <div
                className="pointer-events-none absolute -top-12 -left-12 w-48 h-48 rounded-full blur-3xl opacity-15"
                style={{ background: tierObj.gradientFrom }}
            />

            {/* Periyot seçici */}
            <div className="flex items-center justify-between gap-2 mb-5">
                <span className="text-sm font-medium text-zinc-400">Momentum</span>
                <div className="flex rounded-xl overflow-hidden border border-white/10 bg-[#18181b] text-xs p-0.5">
                    {(["thisMonth", "allTime"] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => setView(p)}
                            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                                view === p ? "bg-zinc-800 text-zinc-100 font-semibold" : "text-zinc-400 hover:text-zinc-200"
                            }`}
                        >
                            {p === "thisMonth" ? "Bu Ay" : "Tüm Zamanlar"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Skor + Tier */}
            <div className="flex items-center gap-5 mb-6">
                <TierBadge
                    tierKey={tier.key}
                    size="lg"
                    showLabel
                    showProgress
                    score={momentum}
                />
                <div>
                    <div className="text-4xl font-extrabold text-zinc-100 tracking-tight">
                        {formatMomentum(momentum)}
                    </div>
                    <div className="text-sm text-zinc-400 mt-0.5">
                        {tier.pointsToNext != null
                            ? `${formatMomentum(tier.pointsToNext)} puan → ${getTierForScore(momentum + tier.pointsToNext).label}`
                            : "Maksimum lig"
                        }
                    </div>
                </div>
            </div>

            {/* Özet İlerleme (Yalnızca 3 sade gösterge — tam veriler Analiz sayfasında) */}
            <div className="grid grid-cols-3 gap-3 mb-5 rounded-xl bg-[#18181b]/80 border border-white/[0.06] p-3 sm:p-4">
                <MetricItem
                    label="Çalışma"
                    value={`${data.metrics.studyMinutes} dk`}
                />
                <MetricItem
                    label="Aktif Gün"
                    value={data.metrics.activeDays}
                    sub={`/ ${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()} gün`}
                />
                <MetricItem
                    label="Doğruluk"
                    value={`%${Math.round(data.metrics.accuracyRate * 100)}`}
                />
            </div>

            {/* Rozetler */}
            {data.badges.length > 0 && (
                <div>
                    <div className="text-xs font-medium text-zinc-400 mb-2">Rozetler</div>
                    <BadgeList earnedKeys={data.badges.map(b => b.key)} />
                </div>
            )}
        </div>
    );
}
