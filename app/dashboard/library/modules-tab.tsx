
"use client";

import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModuleCard } from "@/components/module/module-card";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface ModulesTabProps {
    modules: any[] | undefined;
    isLoading: boolean;
    viewMode: 'grid' | 'list';
    searchQuery: string;
    selectedType: string;
    selectedCategory: string;
}

export function ModulesTab({
    modules,
    isLoading,
    viewMode,
    searchQuery,
    selectedType,
    selectedCategory
}: ModulesTabProps) {
    const filteredModules = modules?.filter(item => {
        const matchesSearch = item.module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.module.description && item.module.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesType = selectedType === "ALL" || item.module.type === selectedType;
        const matchesCategory = selectedCategory === "ALL" || item.module.category === selectedCategory;
        return matchesSearch && matchesType && matchesCategory;
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

    if (!filteredModules || filteredModules.length === 0) {
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
        <Tabs defaultValue="all" className="w-full">
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

            <TabsContent value="all" className="mt-0">
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                    {filteredModules.map((item) => (
                        <ModuleCard key={item.moduleId} module={item.module} solvedCount={item.solvedCount} viewMode={viewMode} />
                    ))}
                </div>
            </TabsContent>

            <TabsContent value="created" className="mt-0">
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                    {filteredModules.filter(m => m.role === 'OWNER').map((item) => (
                        <ModuleCard key={item.moduleId} module={item.module} solvedCount={item.solvedCount} viewMode={viewMode} />
                    ))}
                    {filteredModules.filter(m => m.role === 'OWNER').length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            Henüz orijinal bir modül oluşturmadınız.
                        </div>
                    )}
                </div>
            </TabsContent>

            <TabsContent value="forked" className="mt-0">
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                    {filteredModules.filter(m => m.role === 'SAVED').map((item) => (
                        <ModuleCard key={item.moduleId} module={item.module} solvedCount={item.solvedCount} viewMode={viewMode} />
                    ))}
                    {filteredModules.filter(m => m.role === 'SAVED').length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            Henüz kitaplığınıza eklediğiniz bir modül yok.
                        </div>
                    )}
                </div>
            </TabsContent>
        </Tabs>
    );
}
