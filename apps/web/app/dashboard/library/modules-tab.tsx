
"use client";

import { BookOpen, Plus } from "lucide-react";
import { BrandLoader } from "@/components/ui/brand-loader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModuleCard } from "@/components/module/module-card";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/i18n";
import { EmptyState } from "@/components/shared/empty-state";

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
    const { t } = useTranslation();

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
            <EmptyState
                icon={BookOpen}
                title={searchQuery ? "Sonuç bulunamadı" : "Henüz modülün yok"}
                description={
                    searchQuery
                        ? `"${searchQuery}" için eşleşen bir modül bulunamadı. Farklı bir arama dene.`
                        : "İlk modülünü oluştur ve öğrenmeye başla. AI yardımıyla dakikalar içinde içerik hazırlayabilirsin."
                }
                primaryAction={{ label: "Yeni Modül Oluştur", href: "/dashboard/create" }}
                secondaryAction={{ label: "Keşfet", href: "/dashboard/discover" }}
            />
        );
    }

    return (
        <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
            <div className="flex items-center justify-between mb-4">
                <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
                    <TabsTrigger value="all">{t('library.modulesTab.all')}</TabsTrigger>
                    <TabsTrigger value="created">{t('library.modulesTab.created')}</TabsTrigger>
                    <TabsTrigger value="forked">{t('library.modulesTab.saved')}</TabsTrigger>
                </TabsList>
                <Button asChild className="hidden sm:flex">
                    <Link href="/dashboard/create">
                        <Plus className="mr-2 h-4 w-4" /> {t('library.modulesTab.newModule')}
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
                        <div className="flex items-center gap-2 text-muted-foreground font-medium">
                            <BrandLoader size="sm" />
                            {t('library.modulesTab.loadingMore')}
                        </div>
                    ) : (
                        <div className="h-8"></div>
                    )}
                </div>
            )}
        </Tabs>
    );
}
