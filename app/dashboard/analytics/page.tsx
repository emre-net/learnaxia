"use client";

import { useEffect, useState } from "react";
import { DailyActivityChart } from "@/components/analytics/daily-activity-chart";
import { ModulePerformanceList } from "@/components/analytics/module-performance-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, BookOpen, Clock, Loader2, TrendingUp } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function AnalyticsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/analytics");
                if (!res.ok) throw new Error("Failed to load analytics");
                const json = await res.json();
                setData(json);
            } catch (error) {
                console.error(error);
                toast({ title: "Error", description: "Could not load analytics data.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [toast]);

    if (loading) {
        return <div className="flex h-full items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    if (!data) return null;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
                <p className="text-muted-foreground">Detailed insights into your learning progress.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Study Time</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.stats.totalStudyMinutes}m</div>
                        <p className="text-xs text-muted-foreground">Lifetime total time spent learning.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Modules Started</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.stats.modulesStarted}</div>
                        <p className="text-xs text-muted-foreground">Active modules in your library.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Daily Streak</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">--</div>
                        <p className="text-xs text-muted-foreground">Coming soon...</p>
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
