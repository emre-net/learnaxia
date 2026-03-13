
"use client";

import { Layers, Plus } from "lucide-react";
import { BrandLoader } from "@/components/ui/brand-loader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CollectionCard } from "@/components/collection/collection-card";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/i18n";

interface CollectionsTabProps {
    viewMode: 'grid' | 'list';
    searchQuery: string;
    selectedCategory: string;
}

export function CollectionsTab({
    viewMode,
    searchQuery,
    selectedCategory
}: CollectionsTabProps) {
    const [activeSubTab, setActiveSubTab] = useState("all");
    const { ref, inView } = useInView();
    const { t } = useTranslation();

    const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useInfiniteQuery({
        queryKey: ['library-collections', searchQuery, selectedCategory, activeSubTab],
        queryFn: async ({ pageParam = 0 }) => {
            const params = new URLSearchParams({
                limit: '12',
                offset: pageParam.toString(),
                search: searchQuery,
                category: selectedCategory,
                role: activeSubTab
            });
            const res = await fetch(`/api/collections?${params}`);
            if (!res.ok) throw new Error('Failed to fetch collections');
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
                <Layers className="h-10 w-10 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-semibold">{t('library.collectionsTab.notFoundTitle')}</h3>
                <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                    {t('library.collectionsTab.notFoundDesc')}
                </p>
                <Button asChild>
                    <Link href="/dashboard/create">{t('library.modulesTab.goToWorkshop')}</Link>
                </Button>
            </div>
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
                    <Link href="/dashboard/collections/new">
                        <Plus className="mr-2 h-4 w-4" /> {t('library.collectionsTab.newCollection')}
                    </Link>
                </Button>
            </div>

            <TabsContent value={activeSubTab} className="mt-0">
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                    {items.map((item) => (
                        <CollectionCard key={item.collectionId} item={item} viewMode={viewMode} />
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
