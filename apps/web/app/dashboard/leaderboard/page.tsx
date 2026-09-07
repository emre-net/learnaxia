"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { TIERS } from "@/lib/scoring/tiers";

type Period = "weekly" | "monthly" | "3month" | "alltime";

interface LeaderboardEntry {
    rank: number;
    userId: string;
    name: string | null;
    handle: string | null;
    image: string | null;
    momentum: number;
    tier: { key: string; label: string; emoji: string; color: string };
    isCurrentUser: boolean;
}

interface LeaderboardData {
    period: Period;
    entries: LeaderboardEntry[];
    myEntry: LeaderboardEntry | null;
    total: number;
}

const PERIOD_LABELS: Record<Period, string> = {
    weekly: "Bu Hafta",
    monthly: "Bu Ay",
    "3month": "Son 3 Ay",
    alltime: "Tüm Zamanlar",
};

function formatMomentum(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString("tr-TR");
}

function RankDisplay({ rank }: { rank: number }) {
    if (rank === 1) return <span className="text-2xl">🥇</span>;
    if (rank === 2) return <span className="text-2xl">🥈</span>;
    if (rank === 3) return <span className="text-2xl">🥉</span>;
    return (
        <span className="w-8 text-center text-sm font-bold text-white/40">
            {rank}
        </span>
    );
}

function EntryRow({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
    return (
        <div
            className={`
                group flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200
                ${isMe
                    ? "border border-white/10 bg-white/[0.06]"
                    : "hover:bg-white/[0.03]"
                }
            `}
            style={isMe ? { borderColor: `${entry.tier.color}30` } : {}}
        >
            {/* Sıra */}
            <div className="w-8 flex justify-center">
                <RankDisplay rank={entry.rank} />
            </div>

            {/* Avatar */}
            <div
                className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border"
                style={{ borderColor: `${entry.tier.color}40` }}
            >
                {entry.image ? (
                    <Image src={entry.image} alt={entry.name ?? "Kullanıcı"} fill className="object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5 text-base">
                        {entry.tier.emoji}
                    </div>
                )}
            </div>

            {/* Ad / Handle */}
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                    {entry.name ?? "Gizli Kullanıcı"}
                    {isMe && (
                        <span className="ml-2 text-xs text-white/30">(sen)</span>
                    )}
                </div>
                {entry.handle && (
                    <div className="text-xs text-white/30 truncate">@{entry.handle}</div>
                )}
            </div>

            {/* Tier chip */}
            <div
                className="hidden sm:flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border"
                style={{
                    color: entry.tier.color,
                    borderColor: `${entry.tier.color}30`,
                    background: `${entry.tier.color}10`,
                }}
            >
                {entry.tier.emoji} {entry.tier.label}
            </div>

            {/* Momentum */}
            <div className="text-right">
                <div className="text-sm font-bold text-white">
                    {formatMomentum(entry.momentum)}
                </div>
                <div className="text-xs text-white/30">momentum</div>
            </div>
        </div>
    );
}

export default function LeaderboardPage() {
    const [period, setPeriod] = useState<Period>("monthly");
    const [tierFilter, setTierFilter] = useState("all");
    const [data, setData] = useState<LeaderboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/leaderboard?period=${period}&tier=${tierFilter}&limit=50`)
            .then(r => r.json())
            .then(setData)
            .finally(() => setLoading(false));
    }, [period, tierFilter]);

    const myEntryInList = data?.entries.find(e => e.isCurrentUser);
    const myEntry = myEntryInList ?? data?.myEntry;

    return (
        <div className="min-h-screen bg-[#08080F] text-white">
            {/* Header */}
            <div className="border-b border-white/5 px-6 py-6">
                <h1 className="text-2xl font-black tracking-tight">🏆 Liderboard</h1>
                <p className="text-sm text-white/40 mt-1">
                    En yüksek Momentum puanına sahip öğrenciler
                </p>
            </div>

            <div className="px-6 py-5 space-y-5 max-w-2xl mx-auto">
                {/* Filtreler */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Periyot */}
                    <div className="flex rounded-xl overflow-hidden border border-white/10 text-sm flex-1">
                        {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`flex-1 px-3 py-2 transition-colors ${
                                    period === p
                                        ? "bg-white/10 text-white font-medium"
                                        : "text-white/40 hover:text-white/70"
                                }`}
                            >
                                {PERIOD_LABELS[p]}
                            </button>
                        ))}
                    </div>

                    {/* Tier filtresi */}
                    <select
                        value={tierFilter}
                        onChange={e => setTierFilter(e.target.value)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 focus:outline-none"
                    >
                        <option value="all">Tüm Tierlar</option>
                        {TIERS.map(t => (
                            <option key={t.key} value={t.key}>
                                {t.emoji} {t.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Liste */}
                {loading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-14 rounded-xl bg-white/[0.03] animate-pulse"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-1">
                        {data?.entries.map(entry => (
                            <EntryRow
                                key={entry.userId}
                                entry={entry}
                                isMe={entry.isCurrentUser}
                            />
                        ))}

                        {/* Kullanıcı ilk 50'de değilse */}
                        {!myEntryInList && myEntry && (
                            <>
                                <div className="flex items-center gap-2 py-2">
                                    <div className="flex-1 h-px bg-white/10" />
                                    <span className="text-xs text-white/30">···</span>
                                    <div className="flex-1 h-px bg-white/10" />
                                </div>
                                <EntryRow entry={myEntry} isMe />
                            </>
                        )}

                        {data?.entries.length === 0 && (
                            <div className="text-center py-12 text-white/30 text-sm">
                                Henüz bu dönem için veri yok.
                            </div>
                        )}
                    </div>
                )}

                {/* Toplam */}
                {data && data.total > 0 && (
                    <p className="text-center text-xs text-white/20">
                        {data.total.toLocaleString("tr-TR")} aktif kullanıcı arasından
                    </p>
                )}
            </div>
        </div>
    );
}
