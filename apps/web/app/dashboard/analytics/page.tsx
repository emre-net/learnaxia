"use client";

import { useEffect, useState } from "react";
import { DailyActivityChart } from "@/components/analytics/daily-activity-chart";
import { ModulePerformanceList } from "@/components/analytics/module-performance-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Clock } from "lucide-react";
import { BrandLoader } from "@/components/ui/brand-loader";
import { useToast } from "@/components/ui/use-toast";

export default function AnalyticsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const fetchData = async () => {
            try {
                const res = await fetch("/api/analytics", { signal: controller.signal });
                if (!res.ok) throw new Error("Failed to load analytics");
                const json = await res.json();
                setData(json);
            } catch (error: any) {
                console.error(error);
                const message = error.name === 'AbortError' ? "Bağlantı zaman aşımına uğradı." : "Analiz verileri yüklenemedi.";
                toast({ title: "Hata", description: message, variant: "destructive" });
                setData({ stats: { totalStudyMinutes: 0, modulesStarted: 0 }, dailyActivity: [], moduleStats: [] }); // Fallback empty data
            } finally {
                clearTimeout(timeoutId);
                setLoading(false);
            }
        };
        fetchData();
        return () => {
            controller.abort();
            clearTimeout(timeoutId);
        };
    }, [toast]);

    if (loading) {
        return (
            <div className="flex flex-col h-[70vh] items-center justify-center p-8 gap-4">
                <BrandLoader size="lg" />
                <p className="text-sm text-muted-foreground animate-pulse">Veriler hazırlanıyor...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
                <p className="text-muted-foreground">Detailed insights into your learning progress.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="glass group hover:sea-glow transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Study Time</CardTitle>
                        <Clock className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.stats.totalStudyMinutes}m</div>
                        <p className="text-xs text-muted-foreground">Lifetime total time spent learning.</p>
                    </CardContent>
                </Card>
                <Card className="glass group hover:sea-glow transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Modules Started</CardTitle>
                        <BookOpen className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.stats.modulesStarted}</div>
                        <p className="text-xs text-muted-foreground">Active modules in your library.</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Area */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    <DailyActivityChart data={data.dailyActivity} />
                </div>
                <div className="col-span-3">
                    <ModulePerformanceList data={data.moduleStats} />
                </div>
            </div>
        </div>
    );
}
