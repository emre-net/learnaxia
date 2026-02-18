"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Module } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, List as ListIcon, Search, Plus, BookOpen, Clock, MoreVertical, Layers, CheckSquare, FileText, CheckCircle2, Pencil, Copy } from "lucide-react";
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
        sourceModuleId: string | null;
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
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 max-w-[400px] mb-4">
                            <TabsTrigger value="all">Tümü</TabsTrigger>
                            <TabsTrigger value="created">Oluşturduklarım</TabsTrigger>
                            <TabsTrigger value="forked">Kopyalar</TabsTrigger>
                        </TabsList>

                        {isLoading ? (
                            <LibrarySkeleton viewMode={viewMode} />
                        ) : !filteredModules || filteredModules.length === 0 ? (
                            <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-lg p-8 text-center animate-in fade-in-50">
                                <BookOpen className="h-10 w-10 text-muted-foreground opacity-50 mb-4" />
                                <h3 className="text-lg font-semibold">Modül bulunamadı</h3>
                                <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                                    Henüz hiç modül oluşturmadın veya kopyalamadın.
                                </p>
                                <Button asChild>
                                    <Link href="/dashboard/create">Modül Oluştur</Link>
                                </Button>
                            </div>
                        ) : (
                            <>
                                <TabsContent value="all" className="mt-0">
                                    <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                                        {filteredModules.map((item) => (
                                            <ModuleCard key={item.moduleId} module={item.module} viewMode={viewMode} />
                                        ))}
                                    </div>
                                </TabsContent>
                                <TabsContent value="created" className="mt-0">
                                    <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                                        {filteredModules.filter(m => !m.module.sourceModuleId).map((item) => (
                                            <ModuleCard key={item.moduleId} module={item.module} viewMode={viewMode} />
                                        ))}
                                        {filteredModules.filter(m => !m.module.sourceModuleId).length === 0 && (
                                            <div className="col-span-full text-center py-12 text-muted-foreground">
                                                Henüz orijinal bir modül oluşturmadınız.
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                                <TabsContent value="forked" className="mt-0">
                                    <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                                        {filteredModules.filter(m => m.module.sourceModuleId).map((item) => (
                                            <ModuleCard key={item.moduleId} module={item.module} viewMode={viewMode} />
                                        ))}
                                        {filteredModules.filter(m => m.module.sourceModuleId).length === 0 && (
                                            <div className="col-span-full text-center py-12 text-muted-foreground">
                                                Henüz kopyalanmış bir modülünüz yok.
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </>
                        )}
                    </Tabs>
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
    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'FLASHCARD': return <BookOpen className="h-5 w-5 text-blue-500" />;
            case 'MC': return <CheckSquare className="h-5 w-5 text-green-500" />;
            case 'GAP': return <FileText className="h-5 w-5 text-orange-500" />; // Assuming FileText is imported
            case 'TRUE_FALSE': return <CheckCircle2 className="h-5 w-5 text-purple-500" />; // Assuming CheckCircle2 is imported
            default: return <BookOpen className="h-5 w-5 text-gray-500" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'FLASHCARD': return 'Kartlar';
            case 'MC': return 'Çoktan Seçmeli';
            case 'GAP': return 'Boşluk Doldurma';
            case 'TRUE_FALSE': return 'Doğru / Yanlış';
            default: return type;
        }
    };

    if (viewMode === 'list') {
        return (
            <Card className="flex flex-row items-center justify-between p-4 group hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded bg-muted/50 flex items-center justify-center">
                        {getTypeIcon(module.type)}
                    </div>
                    <div>
                        <h3 className="font-semibold hover:underline cursor-pointer">
                            <Link href={`/dashboard/modules/${module.id}`}>{module.title}</Link>
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs font-normal h-5 px-1.5">{getTypeLabel(module.type)}</Badge>
                            <span className="line-clamp-1 border-l pl-2">{module.description || "Açıklama yok"}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        {module._count.items} öğe
                    </span>
                    <span className="hidden sm:inline-block">{new Date(module.createdAt).toLocaleDateString("tr-TR")}</span>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={`/dashboard/create/manual?edit=${module.id}`}>
                                <Pencil className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Card className="flex flex-col h-full hover:border-primary/50 transition-colors group relative overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        {getTypeIcon(module.type)}
                        <Badge variant="outline">{getTypeLabel(module.type)}</Badge>
                    </div>
                    {module.status === 'DRAFT' && <Badge variant="secondary">Taslak</Badge>}
                </div>
                <CardTitle className="mt-2 group-hover:text-primary transition-colors leading-tight">
                    <Link href={`/dashboard/modules/${module.id}`} className="hover:underline underline-offset-4">
                        {module.title}
                    </Link>
                </CardTitle>
                <CardDescription className="line-clamp-2 min-h-[2.5rem] mt-1">
                    {module.description || "Açıklama girilmemiş."}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-2">
                {/* Visual Placeholder */}
                <div className="h-24 bg-gradient-to-br from-muted/50 to-muted/10 rounded-md flex items-center justify-center text-muted-foreground/30 border border-dashed">
                    <span className="text-xs font-medium">Önizleme</span>
                </div>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground flex justify-between border-t py-3 bg-muted/5">
                <span className="flex items-center gap-1 font-medium">
                    <Layers className="h-3 w-3" />
                    {module._count.items} Öğe
                </span>
                <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(module.createdAt).toLocaleDateString("tr-TR")}
                </span>
            </CardFooter>

            {/* Edit Button Overlay (Visible on Hover) */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button variant="secondary" size="icon" className="h-8 w-8 shadow-sm" asChild>
                    <Link href={`/dashboard/create/manual?edit=${module.id}`}>
                        <Pencil className="h-4 w-4" />
                    </Link>
                </Button>
            </div>

            {/* Fork Indicator */}
            {module.sourceModuleId && (
                <div className="absolute top-2 right-2 opacity-100 group-hover:opacity-0 transition-opacity">
                    <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-xs h-6">
                        <Copy className="h-3 w-3 mr-1" /> Kopya
                    </Badge>
                </div>
            )}
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
