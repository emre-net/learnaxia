"use client";

import { useEffect, useState } from "react";

interface DashboardStats {
    totalStudyMinutes: number;
    modulesStarted: number;
    tokenBalance: number;
    accuracy: number;
}

export default function DashboardPage() {
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

                // Calculate accuracy from moduleStats
                let totalCorrect = 0, totalInteractions = 0;
                if (analytics?.moduleStats) {
                    analytics.moduleStats.forEach((m: { accuracy: number; totalInteractions: number }) => {
                        totalCorrect += (m.accuracy / 100) * m.totalInteractions;
                        totalInteractions += m.totalInteractions;
                    });
                }

                setStats({
                    totalStudyMinutes: analytics?.stats?.totalStudyMinutes || 0,
                    modulesStarted: analytics?.stats?.modulesStarted || 0,
                    tokenBalance: wallet?.balance || 0,
                    accuracy: totalInteractions > 0 ? Math.round((totalCorrect / totalInteractions) * 100) : 0,
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
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-6 bg-card rounded-xl border shadow-sm">
                    <h3 className="font-medium text-sm text-muted-foreground">Toplam Çalışma</h3>
                    <div className="text-2xl font-bold mt-2">
                        {loading ? "..." : `${stats.totalStudyMinutes} dk`}
                    </div>
                </div>
                <div className="p-6 bg-card rounded-xl border shadow-sm">
                    <h3 className="font-medium text-sm text-muted-foreground">Aktif Modüller</h3>
                    <div className="text-2xl font-bold mt-2">
                        {loading ? "..." : stats.modulesStarted}
                    </div>
                </div>
                <div className="p-6 bg-card rounded-xl border shadow-sm">
                    <h3 className="font-medium text-sm text-muted-foreground">Jeton Bakiyesi</h3>
                    <div className="text-2xl font-bold mt-2 text-primary">
                        {loading ? "..." : `${stats.tokenBalance} 🪙`}
                    </div>
                </div>
                <div className="p-6 bg-card rounded-xl border shadow-sm">
                    <h3 className="font-medium text-sm text-muted-foreground">Doğruluk Oranı</h3>
                    <div className="text-2xl font-bold mt-2">
                        {loading ? "..." : `%${stats.accuracy}`}
                    </div>
                </div>
            </div>
        </div>
    )
}
