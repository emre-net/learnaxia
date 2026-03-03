"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, LayoutGrid, List, PlayCircle, Clock } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { tr, enUS } from "date-fns/locale";
import { useSettingsStore } from "@/stores/settings-store";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface LearningJourney {
    id: string;
    title: string;
    topic: string;
    status: string;
    createdAt: string;
    _count: {
        slides: number;
    }
}

interface LearningsTabProps {
    viewMode: 'grid' | 'list';
    searchQuery: string;
    dictionary: any;
}

export function LearningsTab({ viewMode, searchQuery, dictionary }: LearningsTabProps) {
    const { language } = useSettingsStore();

    const { data: journeys, isLoading } = useQuery<LearningJourney[]>({
        queryKey: ['library-journeys'],
        queryFn: async () => {
            const res = await fetch('/api/library/journeys');
            if (!res.ok) throw new Error('Failed to fetch journeys');
            return res.json();
        }
    });

    const [progressMap, setProgressMap] = useState<Record<string, number>>({});

    useEffect(() => {
        if (!journeys) return;
        const newMap: Record<string, number> = {};
        for (const j of journeys) {
            const saved = localStorage.getItem(`journey_progress_${j.id}`);
            if (saved) {
                newMap[j.id] = parseInt(saved, 10) + 1; // Slide number (1-indexed)
            } else {
                newMap[j.id] = 1;
            }
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProgressMap(newMap);
    }, [journeys]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const filteredJourneys = journeys?.filter(j =>
        j.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    if (filteredJourneys.length === 0) {
        return (
            <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
                <h3 className="text-xl font-semibold mb-2">{searchQuery ? 'No results found' : 'No Learnings Found'}</h3>
                <p className="text-muted-foreground mb-4">You have not started any interactive learning journeys yet.</p>
                <Link href="/dashboard/learning/create">
                    <Button>Start a New Journey</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className={cn(
            viewMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "flex flex-col gap-4"
        )}>
            {filteredJourneys.map((journey) => {
                const isGenerating = journey.status === 'GENERATING';
                const currentSlide = progressMap[journey.id] || 1;
                const totalSlides = journey._count.slides;
                const isCompleted = currentSlide >= totalSlides && !isGenerating && totalSlides > 0;

                return (
                    <Card key={journey.id} className={cn(
                        "group hover:border-indigo-500/50 transition-all duration-300 overflow-hidden relative",
                        viewMode === 'list' && "flex flex-row items-center"
                    )}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-emerald-500 opacity-50 group-hover:opacity-100 transition-opacity" />

                        <CardContent className={cn(
                            "p-5",
                            viewMode === 'list' ? "flex-1 pb-5" : "pb-2"
                        )}>
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                    {journey.topic}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {formatDistanceToNow(new Date(journey.createdAt), {
                                        addSuffix: true,
                                        locale: language === 'tr' ? tr : enUS
                                    })}
                                </span>
                            </div>

                            <h3 className="font-semibold text-lg line-clamp-2 mt-3">{journey.title}</h3>

                            <div className="mt-4 text-sm text-muted-foreground flex flex-col gap-1">
                                <div>Status: {isGenerating ? <Loader2 className="inline h-3 w-3 animate-spin" /> : (isCompleted ? "Completed" : "Active")}</div>
                                <div>Progress: {isGenerating ? "Generating..." : `${currentSlide} / ${totalSlides} Slides`}</div>
                            </div>
                        </CardContent>

                        <CardFooter className={cn(
                            "p-5 pt-0",
                            viewMode === 'list' && "pt-5 pb-5 w-48 justify-end"
                        )}>
                            <Link href={`/dashboard/learning/j/${journey.id}`} className="w-full">
                                <Button className="w-full gap-2 transition-transform group-hover:scale-[1.02]" variant={isCompleted ? "outline" : "default"}>
                                    <PlayCircle className="h-4 w-4" />
                                    {isGenerating ? "Check Status" : (isCompleted ? "Review Journey" : "Continue")}
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                )
            })}
        </div>
    );
}
