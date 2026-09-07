"use client";

import { useEffect, useState } from "react";
import { BookOpen, Clock, ShieldCheck, TrendingUp, CheckCircle2, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/i18n";

interface DashboardStats {
    totalStudyMinutes: number;
    modulesStarted: number;
    totalSolved: number;
    averageAccuracy: number;
}

import { FocusWidget } from "@/components/dashboard/focus-widget";
import { DailyReviewWidget } from "@/components/dashboard/daily-review-widget";
import { ScoreCard } from "@/components/scoring/score-card";
import { OnboardingModal } from "@/components/onboarding/onboarding-modal";

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
    const [loading, setLoading] = useState(true);
    const [onboardingComplete, setOnboardingComplete] = useState(true); // default true = don't flash

    useEffect(() => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        async function fetchStats() {
            try {
                const [analyticsRes, profileRes] = await Promise.all([
                    fetch("/api/analytics", { signal: controller.signal }),
                    fetch("/api/user/profile", { signal: controller.signal }),
                ]);
                const analytics = analyticsRes.ok ? await analyticsRes.json() : null;
                const profile = profileRes.ok ? await profileRes.json() : null;

                setStats({
                    totalStudyMinutes: analytics?.stats?.totalStudyMinutes || 0,
                    modulesStarted: analytics?.stats?.modulesStarted || 0,
                    totalSolved: analytics?.stats?.totalSolved || 0,
                    averageAccuracy: analytics?.stats?.averageAccuracy || 0,
                });

                // Onboarding kontrolü
                const settings = profile?.settings as Record<string, unknown> | null;
                setOnboardingComplete(!!settings?.onboardingComplete);

            } catch (error: any) {
                console.error("Dashboard stats fetch error:", error);
            } finally {
                clearTimeout(timeoutId);
                setLoading(false);
            }
        }
        fetchStats();
        return () => {
            controller.abort();
            clearTimeout(timeoutId);
        };
    }, []);

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
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full">
            {/* Onboarding Modal — sadece yeni kullanıcılara gösterilir */}
            <OnboardingModal completed={onboardingComplete} />

            {/* Hero Welcome Strip */}
            <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {/* Gradient Avatar */}
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-xl font-black text-white shadow-lg shrink-0`}>
                        {initials}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            {t('dashboard.greeting', { name: firstName })}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <Flame className="w-4 h-4 text-amber-400" />
                            <span className="text-sm text-muted-foreground">Çalışmaya devam et, harika gidiyorsun!</span>
                        </div>
                    </div>
                </div>

                {isAdmin && (
                    <Button asChild variant="outline" className="rounded-full border-blue-500/30 text-blue-400 hover:bg-blue-900/20 font-bold gap-2 btn-press shrink-0">
                        <Link href="/admin">
                            <ShieldCheck className="w-4 h-4" />
                            Admin Panel <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px] ml-1">NEW</Badge>
                        </Link>
                    </Button>
                )}
            </div>

            {/* Daily Review SM2 Alert */}
            <div className="w-full">
                <DailyReviewWidget />
            </div>

            {/* Momentum Score Card */}
            <div className="w-full">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest">Momentum</h3>
                    <Link href="/dashboard/leaderboard" className="text-xs text-white/30 hover:text-white/60 transition-colors">
                        Liderboard →
                    </Link>
                </div>
                <ScoreCard />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Pomodoro/Focus Area */}
                <div className="xl:col-span-1 border-0">
                    <FocusWidget />
                </div>

                {/* Stats Area — 2x2 renk kodlu kartlar */}
                <div className="xl:col-span-2 grid gap-4 grid-cols-1 md:grid-cols-2">
                    {statCards.map((card) => (
                        <Card
                            key={card.title}
                            className={`glass card-hover btn-press border-l-4 ${card.borderColor} group cursor-default`}
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                                <div className={`p-2 rounded-xl ${card.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                                    <card.icon className={`h-4 w-4 ${card.iconColor}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="space-y-2">
                                        <div className="skeleton h-8 w-24 rounded-lg" />
                                        <div className="skeleton h-3 w-32 rounded" />
                                    </div>
                                ) : (
                                    <>
                                        <div className={`text-2xl font-bold ${card.textColor}`}>{card.value}</div>
                                        <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
