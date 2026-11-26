"use client";

import { useEffect, useState } from "react";
import {
    BookOpen,
    Clock,
    ShieldCheck,
    TrendingUp,
    CheckCircle2,
    Flame,
    Play,
    Plus,
    Camera,
    PenTool,
    PlusCircle,
    Map,
    Compass,
    Trophy,
    GraduationCap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/i18n";

import { FocusWidget } from "@/components/dashboard/focus-widget";
import { DailyReviewWidget } from "@/components/dashboard/daily-review-widget";
import { ScoreCard } from "@/components/scoring/score-card";
import { OnboardingModal } from "@/components/onboarding/onboarding-modal";

interface DashboardStats {
    totalStudyMinutes: number;
    modulesStarted: number;
    totalSolved: number;
    averageAccuracy: number;
}

interface RecentModule {
    id: string;
    title: string;
    type: string;
    lastStudied: string;
    itemCount?: number;
}

// Gradient avatar helpers
const AVATAR_GRADIENTS = [
    "from-blue-500 to-violet-600",
    "from-cyan-400 to-blue-500",
    "from-emerald-400 to-cyan-500",
    "from-amber-400 to-red-500",
    "from-violet-500 to-pink-500",
];

function getAvatarGradient(name: string) {
    return AVATAR_GRADIENTS[(name?.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];
}

export default function DashboardPage() {
    const { data: session } = useSession();
    const { t } = useTranslation();
    const isAdmin = (session?.user as any)?.role === "ADMIN";
    const userName = (session?.user as any)?.handle || session?.user?.name || session?.user?.email?.split('@')[0] || "Kullanıcı";
    const firstName = userName.split(' ')[0];
    const initials = firstName.slice(0, 2).toUpperCase();
    const avatarGradient = getAvatarGradient(firstName);

    const [stats, setStats] = useState<DashboardStats>({
        totalStudyMinutes: 0,
        modulesStarted: 0,
        totalSolved: 0,
        averageAccuracy: 0,
    });
    const [recentModules, setRecentModules] = useState<RecentModule[]>([]);
    const [loading, setLoading] = useState(true);
    const [onboardingComplete, setOnboardingComplete] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        async function fetchDashboardData() {
            try {
                const [analyticsRes, profileRes, recentRes] = await Promise.all([
                    fetch("/api/analytics", { signal: controller.signal }),
                    fetch("/api/user/profile", { signal: controller.signal }),
                    fetch("/api/mobile/library/recent", { signal: controller.signal }),
                ]);

                const analytics = analyticsRes.ok ? await analyticsRes.json() : null;
                const profile = profileRes.ok ? await profileRes.json() : null;
                const recentData = recentRes.ok ? await recentRes.json() : null;

                setStats({
                    totalStudyMinutes: analytics?.stats?.totalStudyMinutes || 0,
                    modulesStarted: analytics?.stats?.modulesStarted || 0,
                    totalSolved: analytics?.stats?.totalSolved || 0,
                    averageAccuracy: analytics?.stats?.averageAccuracy || 0,
                });

                if (recentData?.modules && Array.isArray(recentData.modules)) {
                    setRecentModules(recentData.modules);
                }

                const settings = profile?.settings as Record<string, unknown> | null;
                setOnboardingComplete(!!settings?.onboardingComplete);
            } catch (error: any) {
                console.error("Dashboard stats fetch error:", error);
            } finally {
                clearTimeout(timeoutId);
                setLoading(false);
            }
        }

        fetchDashboardData();
        return () => {
            controller.abort();
            clearTimeout(timeoutId);
        };
    }, []);

    const mostRecentModule = recentModules[0] || null;

    const storyBubbles = [
        {
            id: "solve",
            label: "Soru Çöz",
            icon: Camera,
            color: "#38bdf8",
            border: "border-sky-400/70",
            bg: "bg-sky-500/15",
            href: "/dashboard/create/solve-photo",
        },
        {
            id: "journey",
            label: "AI Rotası",
            icon: Map,
            color: "#a855f7",
            border: "border-purple-500/70",
            bg: "bg-purple-500/15",
            href: "/dashboard/learning/create",
        },
        {
            id: "discover",
            label: "Keşfet",
            icon: Compass,
            color: "#34d399",
            border: "border-emerald-400/70",
            bg: "bg-emerald-500/15",
            href: "/dashboard/discover",
        },
        {
            id: "note",
            label: "Yeni Not",
            icon: PenTool,
            color: "#f59e0b",
            border: "border-amber-500/70",
            bg: "bg-amber-500/15",
            href: "/dashboard/notes/new",
        },
        {
            id: "module",
            label: "Yeni Modül",
            icon: PlusCircle,
            color: "#818cf8",
            border: "border-indigo-400/70",
            bg: "bg-indigo-500/15",
            href: "/dashboard/create",
        },
        {
            id: "leaderboard",
            label: "Sıralama",
            icon: Trophy,
            color: "#fb7185",
            border: "border-rose-500/70",
            bg: "bg-rose-500/15",
            href: "/dashboard/leaderboard",
        },
    ];

    return (
        <div className="flex-1 space-y-6 max-w-7xl mx-auto w-full">
            {/* Onboarding Modal */}
            <OnboardingModal completed={onboardingComplete} />

            {/* 1. Header Welcome Bar */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#121215] p-5 md:p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-lg md:text-xl font-bold text-white shadow-lg shrink-0`}>
                        {initials}
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#f4f4f5]">
                            {t('dashboard.greeting', { name: firstName })}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <Flame className="w-4 h-4 text-amber-400" />
                            <span className="text-xs md:text-sm text-[#a1a1aa]">Bugün odaklanmak için harika bir gün!</span>
                        </div>
                    </div>
                </div>

                {isAdmin && (
                    <Button asChild variant="outline" className="rounded-full border-sky-500/30 text-sky-400 hover:bg-sky-500/10 font-semibold gap-2 btn-press shrink-0 text-xs md:text-sm">
                        <Link href="/admin">
                            <ShieldCheck className="w-4 h-4" />
                            Admin Panel
                        </Link>
                    </Button>
                )}
            </div>

            {/* 2. Quick Discovery Story Bubbles (Mobil ile Birebir Eşit) */}
            <div className="w-full">
                <div className="flex items-center gap-3.5 sm:gap-6 overflow-x-auto no-scrollbar py-2 px-1">
                    {storyBubbles.map((story) => (
                        <Link
                            key={story.id}
                            href={story.href}
                            className="flex flex-col items-center gap-2 shrink-0 group focus:outline-none"
                        >
                            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2px] border-2 ${story.border} flex items-center justify-center transition-transform duration-200 group-hover:scale-105 group-active:scale-95 bg-[#121215] shadow-lg`}>
                                <div className={`w-full h-full rounded-full ${story.bg} flex items-center justify-center`}>
                                    <story.icon className="w-6 h-6 sm:w-7 sm:h-7 transition-transform group-hover:rotate-6" style={{ color: story.color }} />
                                </div>
                            </div>
                            <span className="text-xs font-medium text-[#a1a1aa] group-hover:text-[#f4f4f5] transition-colors whitespace-nowrap">
                                {story.label}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* 3. Hero: Kaldığın Yerden Devam Et (İçerik Odaklı) */}
            {mostRecentModule ? (
                <div className="rounded-2xl border border-white/[0.08] bg-[#121215] p-5 md:p-6 shadow-xl relative overflow-hidden group">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
                            <Play className="w-3 h-3 fill-sky-400" />
                            <span>Kaldığın Yerden Devam Et</span>
                        </div>
                        <span className="text-xs text-zinc-400">
                            {new Date(mostRecentModule.lastStudied).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                        </span>
                    </div>

                    <h3 className="text-lg md:text-2xl font-bold text-[#f4f4f5] tracking-tight line-clamp-2 mb-4">
                        {mostRecentModule.title}
                    </h3>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium px-3 py-1 rounded-lg bg-[#18181b] border border-white/[0.08] text-zinc-300">
                                {mostRecentModule.type === "GAP"
                                    ? "Boşluk Doldurma"
                                    : mostRecentModule.type === "MC"
                                    ? "Çoktan Seçmeli"
                                    : mostRecentModule.type === "TRUE_FALSE"
                                    ? "Doğru / Yanlış"
                                    : "Flashcard"}
                            </span>
                            {typeof mostRecentModule.itemCount === "number" && (
                                <span className="text-xs text-zinc-400 px-2.5 py-1 rounded-lg bg-[#18181b] border border-white/[0.06]">
                                    {mostRecentModule.itemCount} içerik
                                </span>
                            )}
                        </div>

                        <Button asChild className="rounded-full bg-[#f4f4f5] hover:bg-zinc-200 text-zinc-950 font-bold px-6 gap-2 btn-press">
                            <Link href={`/study/${mostRecentModule.id}`}>
                                <Play className="w-4 h-4 fill-zinc-950" />
                                Hemen Çalış
                            </Link>
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-zinc-800 bg-[#121215]/70 p-6 flex items-center justify-between gap-6">
                    <div className="space-y-2 max-w-lg">
                        <h3 className="text-lg font-bold text-[#f4f4f5]">Bugün Yeni Bir Şey Öğren</h3>
                        <p className="text-sm text-[#a1a1aa]">
                            İlk modülünü oluşturabilir, fotoğrafla soru çözdürebilir veya topluluk setlerini keşfedebilirsin.
                        </p>
                        <Button asChild size="sm" className="rounded-full bg-[#f4f4f5] hover:bg-zinc-200 text-zinc-950 font-bold gap-1.5 mt-2">
                            <Link href="/dashboard/create">
                                <Plus className="w-4 h-4" />
                                İçerik Üret
                            </Link>
                        </Button>
                    </div>
                    <GraduationCap className="w-14 h-14 text-zinc-800 shrink-0 hidden sm:block" />
                </div>
            )}

            {/* 4. Akıllı Tekrar & Momentum & Odaklanma (İçerik Odaklı Yerleşim) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-7 space-y-6">
                    <DailyReviewWidget />
                    <ScoreCard />
                </div>
                <div className="xl:col-span-5">
                    <FocusWidget />
                </div>
            </div>

            {/* 5. Son Aktiviteler (Mobil ile Birebir Eşit) */}
            {recentModules.length > 0 && (
                <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-[#f4f4f5]">Son Aktiviteler</h3>
                        <Link href="/dashboard/library" className="text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors">
                            Tümünü Gör →
                        </Link>
                    </div>
                    <div className="flex items-stretch gap-3.5 overflow-x-auto no-scrollbar pb-2">
                        {recentModules.slice(0, 6).map((mod) => (
                            <Link
                                key={mod.id}
                                href={`/study/${mod.id}`}
                                className="min-w-[210px] max-w-[230px] shrink-0 rounded-2xl border border-white/[0.08] bg-[#121215] hover:border-sky-500/40 p-4 flex flex-col justify-between gap-3 transition-colors"
                            >
                                <div className="space-y-2">
                                    <span className="inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-[#18181b] text-sky-400 border border-white/[0.06]">
                                        {mod.type === "GAP"
                                            ? "Boşluk Doldurma"
                                            : mod.type === "MC"
                                            ? "Çoktan Seçmeli"
                                            : mod.type === "TRUE_FALSE"
                                            ? "Doğru / Yanlış"
                                            : "Flashcard"}
                                    </span>
                                    <h4 className="text-sm font-semibold text-zinc-100 line-clamp-2">
                                        {mod.title}
                                    </h4>
                                </div>
                                <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                                    <span>{mod.itemCount ?? 0} içerik</span>
                                    <span className="text-sky-400 font-medium">Çalış →</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
