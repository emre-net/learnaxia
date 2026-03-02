"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrainCircuit, BookType, ArrowRight, Loader2, Play } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n/i18n";

interface DueModule {
    module: {
        id: string;
        title: string;
        description: string | null;
        category: string | null;
    };
    dueCount: number;
    itemIds: string[];
}

interface DailyQueueData {
    totalDue: number;
    modules: DueModule[];
}

export function DailyReviewWidget() {
    const [data, setData] = useState<DailyQueueData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { t } = useTranslation();

    useEffect(() => {
        async function fetchDailyQueue() {
            try {
                const res = await fetch("/api/study/daily-queue");
                if (!res.ok) throw new Error("Failed to fetch daily queue");
                const json = await res.json();
                setData(json);
            } catch (err: any) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchDailyQueue();
    }, []);

    if (loading) {
        return (
            <Card className="border-blue-500/20 shadow-lg shadow-blue-500/5 bg-gradient-to-br from-blue-500/5 to-purple-500/5 dark:from-blue-900/10 dark:to-purple-900/10">
                <CardContent className="flex items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </CardContent>
            </Card>
        );
    }

    if (error || !data) {
        return null;
    }

    // Success State - No reviews pending!
    if (data.totalDue === 0) {
        return (
            <Card className="border-green-500/20 shadow-lg shadow-green-500/5 bg-gradient-to-br from-green-500/5 to-emerald-500/5 dark:from-green-900/10 dark:to-emerald-900/10">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mb-2">
                        <BrainCircuit className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight">{t('dashboard.dailyReview.completedTitle')}</h3>
                    <p className="text-muted-foreground text-sm max-w-sm">{t('dashboard.dailyReview.completedDesc')}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-blue-500/20 shadow-lg shadow-blue-500/5 bg-gradient-to-br from-blue-500/5 via-background to-purple-500/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-bold flex items-center gap-2">
                            <BrainCircuit className="w-6 h-6 text-blue-500" />
                            {t('dashboard.dailyReview.title')}
                        </CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-2">
                            {t('dashboard.dailyReview.duePrefix')}
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400">
                                {data.totalDue} {t('dashboard.dailyReview.dueCards')}
                            </Badge> {t('dashboard.dailyReview.dueSuffix')}
                        </CardDescription>
                    </div>

                    {/* Optional: Mix All Button */}
                    <div className="hidden sm:block">
                        <Button variant="outline" className="border-blue-500/30 text-blue-600 hover:bg-blue-50" asChild>
                            <Link href={`/study/daily`}>
                                {t('dashboard.mixAll')} <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                    {data.modules.map((m) => (
                        <div key={m.module.id} className="group relative flex flex-col justify-between p-4 rounded-xl border bg-card hover:border-blue-500/50 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-1">
                                    <h4 className="font-semibold line-clamp-1 group-hover:text-blue-600 transition-colors" title={m.module.title}>
                                        {m.module.title}
                                    </h4>
                                    {m.module.category && (
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <BookType className="w-3 h-3" /> {m.module.category}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-shrink-0">
                                    <Badge variant="secondary" className="font-mono bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                        {m.dueCount} Due
                                    </Badge>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2"
                                size="sm"
                                asChild
                            >
                                <Link href={`/study/${m.module.id}?mode=SM2`}>
                                    <Play className="w-3 h-3 fill-current" /> {t('dashboard.dailyReview.studyJustThis')}
                                </Link>
                            </Button>
                        </div>
                    ))}
                </div>

                {/* Mobile Mix All Fallback */}
                <div className="mt-6 sm:hidden">
                    <Button className="w-full" variant="outline" asChild>
                        <Link href={`/study/daily`}>
                            {t('dashboard.mixAll')} <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
