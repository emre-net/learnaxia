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
            color: "#818cf8",
            border: "border-indigo-500/70",
            bg: "bg-indigo-500/15",
            href: "/dashboard/create/solve-photo",
        },
        {
            id: "note",
            label: "Not Al",
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
            color: "#38bdf8",
            border: "border-sky-500/70",
            bg: "bg-sky-500/15",
            href: "/dashboard/create",
        },
        {
            id: "journey",
            label: "Yeni Rota",
            icon: Map,
            color: "#a855f7",
            border: "border-purple-500/70",
            bg: "bg-purple-500/15",
            href: "/dashboard/learning/create",
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

    const statCards = [
        {
            title: t('settings.duration'),
            value: loading ? null : `${stats.totalStudyMinutes} dk`,
            desc: "Platformda geçirilen süre",
            icon: Clock,
            iconColor: "text-cyan-400",
            iconBg: "bg-cyan-500/10",
            borderColor: "border-cyan-500/40",
            textColor: "text-cyan-400",
        },
        {
            title: t('dashboard.modules'),
            value: loading ? null : stats.modulesStarted,
            desc: "İlerleme kaydettiğin setler",
            icon: BookOpen,
            iconColor: "text-blue-400",
            iconBg: "bg-blue-500/10",
            borderColor: "border-blue-500/40",
            textColor: "text-blue-400",
        },
        {
            title: "Başarı Oranı",
            value: loading ? null : `%${stats.averageAccuracy}`,
            desc: "Genel doğruluk oranınız",
            icon: TrendingUp,
            iconColor: "text-purple-400",
            iconBg: "bg-purple-500/10",
            borderColor: "border-purple-500/40",
            textColor: "text-purple-400",
        },
        {
            title: "Toplam Çözüm",
            value: loading ? null : stats.totalSolved,
            desc: "Çözülen toplam soru sayısı",
            icon: CheckCircle2,
            iconColor: "text-amber-400",
            iconBg: "bg-amber-500/10",
            borderColor: "border-amber-500/40",
            textColor: "text-amber-400",
        },
    ];

    return (
        <div className="flex-1 space-y-6 max-w-7xl mx-auto w-full">
            {/* Onboarding Modal */}
            <OnboardingModal completed={onboardingComplete} />

            {/* 1. Header Welcome Bar */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#121215] p-5 md:p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-lg md:text-xl font-black text-white shadow-lg shrink-0`}>
                        {initials}
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#f4f4f5]">
                            {t('dashboard.greeting', { name: firstName })}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <Flame className="w-4 h-4 text-amber-400" />
                            <span className="text-xs md:text-sm text-[#a1a1aa]">Çalışmaya devam et, harika gidiyorsun!</span>
                        </div>
                    </div>
                </div>

                {isAdmin && (
                    <Button asChild variant="outline" className="rounded-full border-blue-500/30 text-blue-400 hover:bg-blue-900/20 font-bold gap-2 btn-press shrink-0 text-xs md:text-sm">
                        <Link href="/admin">
                            <ShieldCheck className="w-4 h-4" />
                            Admin Panel <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px] ml-1">NEW</Badge>
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
                <div className="rounded-2xl border border-white/10 bg-[#121215] p-5 md:p-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-wider">
                            <Play className="w-3 h-3 fill-sky-400" />
                            <span>Kaldığın Yerden Devam Et</span>
                        </div>
                        <span className="text-xs text-[#71717a]">
                            {new Date(mostRecentModule.lastStudied).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                        </span>
                    </div>

                    <h3 className="text-lg md:text-2xl font-bold text-[#f4f4f5] tracking-tight line-clamp-2 mb-4">
                        {mostRecentModule.title}
                    </h3>

                    <div className="flex items-center justify-between gap-4 pt-2">
                        <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[#a1a1aa]">
                            {mostRecentModule.type === "GAP"
                                ? "Boşluk Doldurma"
                                : mostRecentModule.type === "MC"
                                ? "Çoktan Seçmeli"
                                : mostRecentModule.type === "TRUE_FALSE"
                                ? "Doğru / Yanlış"
                                : "Flashcard"}
                        </span>

                        <Button asChild className="rounded-full bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold px-6 shadow-lg shadow-indigo-500/25 gap-2 btn-press">
                            <Link href={`/study/${mostRecentModule.id}`}>
                                <Play className="w-4 h-4 fill-white" />
                                Hemen Çalış
                            </Link>
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-[#121215]/50 p-6 flex items-center justify-between gap-6">
                    <div className="space-y-2 max-w-lg">
                        <h3 className="text-lg font-bold text-[#f4f4f5]">Bugün Yeni Bir Şey Öğren</h3>
                        <p className="text-sm text-[#a1a1aa]">
                            İlk modülünü oluşturabilir, fotoğrafla soru çözdürebilir veya topluluk setlerini keşfedebilirsin.
                        </p>
                        <Button asChild size="sm" className="rounded-full bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold gap-1.5 mt-2">
                            <Link href="/dashboard/create">
                                <Plus className="w-4 h-4" />
                                İçerik Üret
                            </Link>
                        </Button>
                    </div>
                    <GraduationCap className="w-14 h-14 text-white/10 shrink-0 hidden sm:block" />
                </div>
            )}

            {/* 4. Daily Review SM2 Alert */}
            <div className="w-full">
                <DailyReviewWidget />
            </div>

            {/* 5. Momentum Score Card */}
            <div className="w-full">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest">Momentum & Seviye</h3>
                    <Link href="/dashboard/leaderboard" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                        Liderlik Tablosu →
                    </Link>
                </div>
                <ScoreCard />
            </div>

            {/* 6. Focus & Quick Stats Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Pomodoro / Focus Area */}
                <div className="xl:col-span-1">
                    <FocusWidget />
                </div>

                {/* Stats Area — 2x2 Dark Zinc Cards */}
                <div className="xl:col-span-2 grid gap-4 grid-cols-1 sm:grid-cols-2">
                    {statCards.map((card) => (
                        <Card
                            key={card.title}
                            className={`bg-[#121215] border border-white/[0.08] card-hover border-l-4 ${card.borderColor} group cursor-default`}
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-[#a1a1aa]">{card.title}</CardTitle>
                                <div className={`p-2 rounded-xl ${card.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                                    <card.icon className={`h-4 w-4 ${card.iconColor}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="space-y-2">
                                        <div className="h-8 w-24 bg-white/5 rounded-lg animate-pulse" />
                                        <div className="h-3 w-32 bg-white/5 rounded animate-pulse" />
                                    </div>
                                ) : (
                                    <>
                                        <div className={`text-2xl font-bold ${card.textColor}`}>{card.value}</div>
                                        <p className="text-xs text-[#71717a] mt-1">{card.desc}</p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
