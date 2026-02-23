"use client";

import { useEffect, useState } from "react";
import { Activity, BookOpen, Clock, Coins, Target, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DashboardStats {
    totalStudyMinutes: number;
    modulesStarted: number;
    tokenBalance: number;
    accuracy: number;
}

export default function DashboardPage() {
    const { data: session } = useSession();
    const isAdmin = (session?.user as any)?.role === "ADMIN";

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
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Genel Bakış</h2>
                {isAdmin && (
                    <Link href="/admin">
                        <Button variant="outline" className="rounded-2xl border-blue-500/30 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold gap-2">
                            <ShieldCheck className="w-4 h-4" />
                            Admin Panel <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px] ml-1">NEW</Badge>
                        </Button>
                    </Link>
                )}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Çalışma</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? "..." : `${stats.totalStudyMinutes} dk`}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Aktif Modüller</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? "..." : stats.modulesStarted}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Jeton Bakiyesi</CardTitle>
                        <Coins className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                            {loading ? "..." : `${stats.tokenBalance} 🪙`}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Doğruluk Oranı</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? "..." : `%${stats.accuracy}`}</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
