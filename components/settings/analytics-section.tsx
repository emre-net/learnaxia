
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, BookOpen, Activity, Loader2 } from "lucide-react";
import { DailyActivityChart } from "@/components/analytics/daily-activity-chart";
import { ModulePerformanceList } from "@/components/analytics/module-performance-list";

interface AnalyticsSectionProps {
    data: any | null;
    loading: boolean;
}

export function AnalyticsSection({ data, loading }: AnalyticsSectionProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!data) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">Henüz istatistik verisi yok.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Çalışma Süresi</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.stats?.totalStudyMinutes ?? 0}dk</div>
                        <p className="text-xs text-muted-foreground">Toplam öğrenme süresi.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Başlanan Modüller</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.stats?.modulesStarted ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Kütüphanenizdeki aktif modüller.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Günlük Seri</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">--</div>
                        <p className="text-xs text-muted-foreground">Yakında...</p>
                    </CardContent>
                </Card>
            </div>
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
