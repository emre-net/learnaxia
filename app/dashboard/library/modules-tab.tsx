
"use client";

import { BookOpen, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModuleCard } from "@/components/module/module-card";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";

interface ModulesTabProps {
    viewMode: 'grid' | 'list';
    searchQuery: string;
    selectedType: string;
    selectedCategory: string;
}

export function ModulesTab({
    viewMode,
    searchQuery,
    selectedType,
    selectedCategory
}: ModulesTabProps) {
    const [activeSubTab, setActiveSubTab] = useState("all");
    const { ref, inView } = useInView();

    const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useInfiniteQuery({
        queryKey: ['library-modules', searchQuery, selectedType, selectedCategory, activeSubTab],
        queryFn: async ({ pageParam = 0 }) => {
            const params = new URLSearchParams({
                limit: '12',
                offset: pageParam.toString(),
                search: searchQuery,
                type: selectedType,
                category: selectedCategory,
                role: activeSubTab
            });
            const res = await fetch(`/api/modules?${params}`);
            if (!res.ok) throw new Error('Failed to fetch modules');
            return res.json();
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            const currentTotalItems = allPages.reduce((acc, page) => acc + page.items.length, 0);
            return currentTotalItems < lastPage.total ? currentTotalItems : undefined;
        }
    });

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

    const items = data ? data.pages.flatMap(page => page.items) : [];

    if (isLoading) {
        return (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className={viewMode === 'grid' ? "h-[300px] w-full" : "h-[80px] w-full"} />
                ))}
            </div>
        );
    }

    if (!isLoading && items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-lg p-8 text-center animate-in fade-in-50">
                <BookOpen className="h-10 w-10 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-semibold">Modül bulunamadı</h3>
                <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                    Henüz Atölye'de bir üretim yapmadın veya kütüphanene kayıt eklemedin.
                </p>
                <Button asChild>
                    <Link href="/dashboard/create">Atölye'ye Git</Link>
                </Button>
            </div>
        );
    }

    return (
        <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
            <div className="flex items-center justify-between mb-4">
                <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
                    <TabsTrigger value="all">Tümü</TabsTrigger>
                    <TabsTrigger value="created">Üretimlerim</TabsTrigger>
                    <TabsTrigger value="forked">Kaydedilenler</TabsTrigger>
                </TabsList>
                <Button asChild className="hidden sm:flex">
                    <Link href="/dashboard/create">
                        <Plus className="mr-2 h-4 w-4" /> Yeni Modül
                    </Link>
                </Button>
            </div>

            <TabsContent value={activeSubTab} className="mt-0">
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                    {items.map((item) => (
                        <ModuleCard key={item.moduleId} module={item.module} solvedCount={item.solvedCount} viewMode={viewMode} />
                    ))}
                </div>
            </TabsContent>

            {hasNextPage && (
                <div ref={ref} className="flex justify-center py-8">
                    {isFetchingNextPage ? (
                        <div className="flex items-center gap-2 text-muted-foreground font-medium animate-pulse">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Daha fazla yükleniyor...
                        </div>
                    ) : (
                        <div className="h-8"></div>
                    )}
                </div>
            )}
        </Tabs>
    );
}
