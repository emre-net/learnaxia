"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Module } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, List as ListIcon, Search, Plus, BookOpen, Clock, MoreVertical, Layers } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CreateCollectionDialog } from "@/components/collection/create-collection-dialog";
import { CollectionCard } from "@/components/collection/collection-card";

// Types (Mirroring API response)
type LibraryModule = {
    userId: string;
    moduleId: string;
    role: string;
    lastInteractionAt: string;
    module: {
        id: string;
        title: string;
        description: string | null;
        type: string;
        status: string;
        isForkable: boolean;
        createdAt: string;
        _count: { items: number };
    };
};

// Define types locally if not imported
interface LibraryCollection {
    userId: string;
    collectionId: string;
    role: string;
    lastInteractionAt: string;
    collection: {
        id: string;
        title: string;
        description: string | null;
        isPublic: boolean;
        ownerId: string;
        moduleIds: string[];
        createdAt: string;
        updatedAt: string;
        owner: {
            image: string | null;
            handle: string | null;
        };
    }
}

export function LibraryClient() {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState("");

    const { data: modules, isLoading: isLoadingModules } = useQuery<LibraryModule[]>({
        queryKey: ['library-modules'], // Changed key to avoid conflict and be more specific
        queryFn: async () => {
            const res = await fetch('/api/modules');
            if (!res.ok) throw new Error('Failed to fetch modules');
            return res.json();
        }
    });

    const { data: collections, isLoading: isLoadingCollections } = useQuery<LibraryCollection[]>({
        queryKey: ['library-collections'],
        queryFn: async () => {
            const res = await fetch('/api/collections');
            if (!res.ok) throw new Error('Failed to fetch collections');
            return res.json();
        }
    });

    const filteredModules = modules?.filter(item =>
        item.module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.module.description && item.module.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredCollections = collections?.filter(item =>
        item.collection.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.collection.description && item.collection.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const isLoading = isLoadingModules || isLoadingCollections;

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Kitaplık</h1>
                    <p className="text-muted-foreground">Öğrenme modüllerini ve koleksiyonlarını yönet.</p>
                </div>
            </div>

            <Tabs defaultValue="modules" className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <TabsList>
                        <TabsTrigger value="modules">Modüller</TabsTrigger>
                        <TabsTrigger value="collections">Koleksiyonlar</TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Ara..."
                                className="w-full sm:w-[260px] pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center border rounded-md">
                            <Button
                                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                size="icon"
                                onClick={() => setViewMode('grid')}
                                className="rounded-none rounded-l-md h-9 w-9"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                size="icon"
                                onClick={() => setViewMode('list')}
                                className="rounded-none rounded-r-md h-9 w-9"
                            >
                                <ListIcon className="h-4 w-4" />
                            </Button>
                        </div>
                        <TabsContent value="modules" className="m-0 border-0 p-0">
                            <Button asChild>
                                <Link href="/dashboard/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Yeni Modül
                                </Link>
                            </Button>
                        </TabsContent>
                        <TabsContent value="collections" className="m-0 border-0 p-0">
                            <CreateCollectionDialog />
                        </TabsContent>
                    </div>
                </div>

                <TabsContent value="modules" className="space-y-4">
                    {isLoading ? (
                        <LibrarySkeleton viewMode={viewMode} />
                    ) : !filteredModules || filteredModules.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-lg p-8 text-center animate-in fade-in-50">
                            <BookOpen className="h-10 w-10 text-muted-foreground opacity-50 mb-4" />
                            <h3 className="text-lg font-semibold">Modül bulunamadı</h3>
                            <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                                Henüz hiç modül oluşturmadın.
                            </p>
                            <Button asChild>
                                <Link href="/dashboard/create">Modül Oluştur</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                            {filteredModules.map((item) => (
                                <ModuleCard key={item.moduleId} module={item.module} viewMode={viewMode} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="collections" className="space-y-4">
                    {isLoading ? (
                        <LibrarySkeleton viewMode={viewMode} />
                    ) : !filteredCollections || filteredCollections.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-lg p-8 text-center animate-in fade-in-50">
                            <Layers className="h-10 w-10 text-muted-foreground opacity-50 mb-4" />
                            <h3 className="text-lg font-semibold">Koleksiyon bulunamadı</h3>
                            <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                                Modüllerini koleksiyonlar halinde grupla.
                            </p>
                            <CreateCollectionDialog>
                                <Button>Koleksiyon Oluştur</Button>
                            </CreateCollectionDialog>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                            {filteredCollections.map((item) => (
                                <CollectionCard key={item.collectionId} item={item} viewMode={viewMode} />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div >
    );
}

function ModuleCard({ module, viewMode }: { module: LibraryModule['module'], viewMode: 'grid' | 'list' }) {
    if (viewMode === 'list') {
        return (
            <Card className="flex flex-row items-center justify-between p-4">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                        <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold hover:underline cursor-pointer">
                            <Link href={`/dashboard/modules/${module.id}`}>{module.title}</Link>
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{module.description || "Açıklama yok"}</p>
                    </div>
                </div>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        {module._count.items} öğe
                    </span>
                    <span>{new Date(module.createdAt).toLocaleDateString("tr-TR")}</span>
                    <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </div>
            </Card>
        )
    }

    return (
        <Card className="flex flex-col h-full hover:border-primary/50 transition-colors cursor-pointer group">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <Badge variant="outline" className="mb-2">{module.type}</Badge>
                    {module.status === 'DRAFT' && <Badge variant="secondary">Taslak</Badge>}
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">
                    <Link href={`/dashboard/modules/${module.id}`}>{module.title}</Link>
                </CardTitle>
                <CardDescription className="line-clamp-2 h-10">
                    {module.description || "Açıklama yok."}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                {/* Visual Placeholder for Progress or Preview */}
                <div className="h-24 bg-muted/30 rounded-md flex items-center justify-center text-muted-foreground/50 text-sm">
                    Önizleme Yok
                </div>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground flex justify-between border-t pt-4">
                <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {module._count.items} Öğe
                </span>
                <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(module.createdAt).toLocaleDateString("tr-TR")}
                </span>
            </CardFooter>
        </Card>
    );
}

function LibrarySkeleton({ viewMode }: { viewMode: 'grid' | 'list' }) {
    return (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className={viewMode === 'grid' ? "h-[300px] w-full" : "h-[80px] w-full"} />
            ))}
        </div>
    );
}
