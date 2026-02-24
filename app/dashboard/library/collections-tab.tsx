
"use client";

import { Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CollectionCard } from "@/components/collection/collection-card";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface CollectionsTabProps {
    collections: any[] | undefined;
    isLoading: boolean;
    viewMode: 'grid' | 'list';
    searchQuery: string;
    selectedCategory: string;
}

export function CollectionsTab({
    collections,
    isLoading,
    viewMode,
    searchQuery,
    selectedCategory
}: CollectionsTabProps) {
    const filteredCollections = collections?.filter(item => {
        const matchesSearch = item.collection.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.collection.description && item.collection.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = selectedCategory === "ALL" || item.collection.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (isLoading) {
        return (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className={viewMode === 'grid' ? "h-[300px] w-full" : "h-[80px] w-full"} />
                ))}
            </div>
        );
    }

    if (!filteredCollections || filteredCollections.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-lg p-8 text-center animate-in fade-in-50">
                <Layers className="h-10 w-10 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-semibold">Koleksiyon bulunamadı</h3>
                <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                    Modüllerini koleksiyonlar halinde grupla.
                </p>
                <Button asChild>
                    <Link href="/dashboard/create">Atölye'ye Git</Link>
                </Button>
            </div>
        );
    }

    return (
        <Tabs defaultValue="all" className="w-full">
            <div className="flex items-center justify-between mb-4">
                <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
                    <TabsTrigger value="all">Tümü</TabsTrigger>
                    <TabsTrigger value="created">Üretimlerim</TabsTrigger>
                    <TabsTrigger value="forked">Kaydedilenler</TabsTrigger>
                </TabsList>
                <Button asChild className="hidden sm:flex">
                    <Link href="/dashboard/collections/new">
                        <Plus className="mr-2 h-4 w-4" /> Yeni Koleksiyon
                    </Link>
                </Button>
            </div>

            <TabsContent value="all" className="mt-0">
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                    {filteredCollections.map((item) => (
                        <CollectionCard key={item.collectionId} item={item} viewMode={viewMode} />
                    ))}
                </div>
            </TabsContent>

            <TabsContent value="created" className="mt-0">
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                    {filteredCollections.filter(c => c.role === 'OWNER').map((item) => (
                        <CollectionCard key={item.collectionId} item={item} viewMode={viewMode} />
                    ))}
                    {filteredCollections.filter(c => c.role === 'OWNER').length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            Henüz bir koleksiyon oluşturmadınız.
                        </div>
                    )}
                </div>
            </TabsContent>

            <TabsContent value="forked" className="mt-0">
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                    {filteredCollections.filter(c => c.role === 'SAVED').map((item) => (
                        <CollectionCard key={item.collectionId} item={item} viewMode={viewMode} />
                    ))}
                    {filteredCollections.filter(c => c.role === 'SAVED').length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            Henüz kaydettiğiniz bir koleksiyon yok.
                        </div>
                    )}
                </div>
            </TabsContent>
        </Tabs>
    );
}
