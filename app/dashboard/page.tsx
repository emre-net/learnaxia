"use client";

import { useEffect, useState } from "react";
import { Activity, BookOpen, Clock, Coins, Target, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/i18n";

interface DashboardStats {
    totalStudyMinutes: number;
    modulesStarted: number;
    tokenBalance: number;
    accuracy: number;
}

import { FocusWidget } from "@/components/dashboard/focus-widget";
import { DailyReviewWidget } from "@/components/dashboard/daily-review-widget";

export default function DashboardPage() {
    const { data: session } = useSession();
    const { t } = useTranslation();
    const isAdmin = (session?.user as any)?.role === "ADMIN";
    const userName = session?.user?.name || "Kullanıcı";

    const [stats, setStats] = useState<DashboardStats>({
        totalStudyMinutes: 0,
        modulesStarted: 0,
        tokenBalance: 0,
        accuracy: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const [analyticsRes, walletRes] = await Promise.all([
                    fetch("/api/analytics"),
                    fetch("/api/wallet"),
                ]);

                const analytics = analyticsRes.ok ? await analyticsRes.json() : null;
                const wallet = walletRes.ok ? await walletRes.json() : null;

                setStats({
                    totalStudyMinutes: analytics?.stats?.totalStudyMinutes || 0,
                    modulesStarted: analytics?.stats?.modulesStarted || 0,
                    tokenBalance: wallet?.balance || 0,
                    accuracy: analytics?.stats?.globalAccuracy || 0,
                });
            } catch (error) {
                console.error("Dashboard stats fetch error:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">{t('dashboard.greeting', { name: userName })}</h2>
                {isAdmin && (
                    <Button asChild variant="outline" className="rounded-full border-blue-500/30 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold gap-2">
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

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Pomodoro/Focus Area */}
                <div className="xl:col-span-1 border-0">
                    <FocusWidget />
                </div>

                {/* Stats Area */}
                <div className="xl:col-span-2 grid gap-4 grid-cols-1 md:grid-cols-2">
                    <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-white/20 dark:border-white/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('settings.duration')}</CardTitle>
                            <Clock className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? "..." : `${stats.totalStudyMinutes} dk`}</div>
                            <p className="text-xs text-muted-foreground mt-1">Platformda geçirdiğin süre</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-white/20 dark:border-white/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('dashboard.modules')}</CardTitle>
                            <BookOpen className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? "..." : stats.modulesStarted}</div>
                            <p className="text-xs text-muted-foreground mt-1">İlerleme kaydettiğin setler</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-white/20 dark:border-white/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">AXIA Tokens</CardTitle>
                            <Coins className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">
                                {loading ? "..." : `${stats.tokenBalance} 🪙`}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Ürettiğin kart sayısı kadar harcanır</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-white/20 dark:border-white/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('settings.successAccuracy')}</CardTitle>
                            <Target className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {loading ? "..." : `%${stats.accuracy}`}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Tüm cevaplara göre isabetin</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    )
}

