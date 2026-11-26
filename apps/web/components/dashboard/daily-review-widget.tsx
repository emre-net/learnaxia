"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrainCircuit, BookType, ArrowRight, Play } from "lucide-react";
import { BrandLoader } from "@/components/ui/brand-loader";
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
            <Card className="bg-[#121215] border border-white/[0.06] rounded-2xl shadow-none">
                <CardContent className="flex items-center justify-center p-12">
                    <BrandLoader size="lg" />
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
            <Card className="bg-[#121215] border border-white/[0.06] rounded-2xl shadow-none overflow-hidden">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-1">
                        <BrainCircuit className="w-7 h-7 text-sky-400" />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight text-[#f4f4f5]">{t('dashboard.dailyReview.completedTitle')}</h3>
                    <p className="text-zinc-400 text-sm max-w-sm">{t('dashboard.dailyReview.completedDesc')}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-[#121215] border border-white/[0.06] rounded-2xl shadow-none relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-sky-500/60" />
            <CardHeader>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-[#f4f4f5]">
                            <BrainCircuit className="w-6 h-6 text-sky-400" />
                            {t('dashboard.dailyReview.title')}
                        </CardTitle>
                        <CardDescription className="mt-1 flex flex-wrap items-center gap-2 text-zinc-400">
                            {t('dashboard.dailyReview.duePrefix')}
                            <Badge variant="outline" className="bg-sky-500/10 text-sky-400 border-sky-500/20">
                                {data.totalDue} {t('dashboard.dailyReview.dueCards')}
                            </Badge> {t('dashboard.dailyReview.dueSuffix')}
                        </CardDescription>
                    </div>

                    {/* Optional: Mix All Button */}
                    <div className="hidden sm:block">
                        <Button variant="outline" className="bg-[#18181b] border-white/[0.08] text-sky-400 hover:bg-zinc-800 hover:text-sky-300 rounded-xl" asChild>
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
                        <div key={m.module.id} className="group relative flex flex-col justify-between p-4 rounded-xl border border-white/[0.06] bg-[#18181b] hover:border-sky-500/40 transition-colors">
                            <div className="flex justify-between items-start mb-4 gap-2">
                                <div className="space-y-1 min-w-0">
                                    <h4 className="font-semibold line-clamp-1 text-[#f4f4f5] group-hover:text-sky-400 transition-colors" title={m.module.title}>
                                        {m.module.title}
                                    </h4>
                                    {m.module.category && (
                                        <div className="text-xs text-zinc-400 flex items-center gap-1">
                                            <BookType className="w-3 h-3" /> {m.module.category}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-shrink-0">
                                    <Badge variant="secondary" className="font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                        {m.dueCount} Due
                                    </Badge>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-sky-500 hover:bg-sky-400 text-[#09090b] font-semibold shadow-none gap-2 rounded-xl"
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
                    <Button className="w-full bg-[#18181b] border-white/[0.08] text-sky-400 hover:bg-zinc-800 rounded-xl" variant="outline" asChild>
                        <Link href={`/study/daily`}>
                            {t('dashboard.mixAll')} <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
