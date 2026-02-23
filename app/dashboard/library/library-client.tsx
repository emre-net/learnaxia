"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Module } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, List as ListIcon, Search, Plus, BookOpen, Clock, MoreVertical, Layers, CheckSquare, FileText, CheckCircle2, Pencil, Copy, Filter, Brain } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useSettingsStore } from "@/stores/settings-store";
import { CreateCollectionDialog } from "@/components/collection/create-collection-dialog";
import { CollectionCard } from "@/components/collection/collection-card";
import { ModuleCard } from "@/components/module/module-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { CATEGORIES } from "@/lib/constants/categories";
import { SolvedQuestion, Note as PrismaNote } from "@prisma/client";

type NoteWithSource = PrismaNote & {
    module?: { title: string } | null;
    solvedQuestion?: { questionText: string } | null;
};

// Types (Mirroring API response)
type LibraryModule = {
    userId: string;
    moduleId: string;
    role: string;
    lastInteractionAt: string;
    solvedCount: number;
    module: {
        id: string;
        title: string;
        description: string | null;
        type: string;
        status: string;
        visibility: 'PUBLIC' | 'PRIVATE';
        isForkable: boolean;
        createdAt: string;
        category: string | null;
        subCategory: string | null;
        sourceModule: {
            id: string;
            title: string;
            owner: { handle: string | null; name: string | null; image: string | null };
        } | null;
        _count: { items: number; userLibrary?: number; forks?: number; sessions?: number };
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
        visibility: 'PUBLIC' | 'PRIVATE';
        ownerId: string;
        moduleIds: string[];
        category: string | null;
        subCategory: string | null;
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
    const [selectedType, setSelectedType] = useState<string>("ALL");
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
    const [activeTab, setActiveTab] = useState("modules");

    const { language } = useSettingsStore();
    const dictionary = getDictionary(language);
    const studyDict = dictionary.study;

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

    const { data: aiSolutions, isLoading: isLoadingSolutions } = useQuery<SolvedQuestion[]>({
        queryKey: ['ai-solutions'],
        queryFn: async () => {
            const res = await fetch('/api/solved-questions');
            if (!res.ok) throw new Error('Failed to fetch solutions');
            return res.json();
        }
    });

    const { data: allNotes, isLoading: isLoadingNotes } = useQuery<NoteWithSource[]>({
        queryKey: ['all-notes'],
        queryFn: async () => {
            // New endpoint or updated existing one
            const res = await fetch('/api/notes');
            if (!res.ok) throw new Error('Failed to fetch notes');
            return res.json();
        }
    });

    const filteredModules = modules?.filter(item => {
        const matchesSearch = item.module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.module.description && item.module.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesType = selectedType === "ALL" || item.module.type === selectedType;
        const matchesCategory = selectedCategory === "ALL" || item.module.category === selectedCategory;
        return matchesSearch && matchesType && matchesCategory;
    });

    const filteredCollections = collections?.filter(item => {
        const matchesSearch = item.collection.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.collection.description && item.collection.description.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = selectedCategory === "ALL" || item.collection.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

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

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="flex flex-col gap-4">
                    <TabsList className="w-full flex-wrap h-auto p-1 justify-start sm:justify-center lg:justify-start">
                        <TabsTrigger value="modules" className="flex-1 sm:flex-none">{dictionary.library.tabs.modules}</TabsTrigger>
                        <TabsTrigger value="collections" className="flex-1 sm:flex-none">{dictionary.library.tabs.collections}</TabsTrigger>
                        <TabsTrigger value="ai-solutions" className="flex-1 sm:flex-none">{dictionary.library.tabs.aiSolutions}</TabsTrigger>
                        <TabsTrigger value="notes" className="flex-1 sm:flex-none">{dictionary.library.tabs.notes}</TabsTrigger>
                    </TabsList>
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
                        <div className="relative flex-1 min-w-[200px] sm:flex-none sm:w-[260px]">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Ara..."
                                className="w-full pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
                            {activeTab === "modules" && (
                                <Select value={selectedType} onValueChange={setSelectedType}>
                                    <SelectTrigger className="flex-1 sm:w-[130px] h-9">
                                        <Filter className="mr-2 h-4 w-4 opacity-70" />
                                        <SelectValue placeholder={studyDict.moduleTypes?.title || "Tip"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">{studyDict.moduleTypes?.all || "Tümü"}</SelectItem>
                                        <SelectItem value="FLASHCARD">{studyDict.moduleTypes?.flashcard || "Kartlar"}</SelectItem>
                                        <SelectItem value="MC">{studyDict.moduleTypes?.mc || "Quiz"}</SelectItem>
                                        <SelectItem value="TRUE_FALSE">{studyDict.moduleTypes?.true_false || "D/Y"}</SelectItem>
                                        <SelectItem value="GAP">{studyDict.moduleTypes?.gap || "Boşluk"}</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}

                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="flex-1 sm:w-[130px] h-9">
                                    <SelectValue placeholder="Kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Tüm Kategoriler</SelectItem>
                                    {Object.keys(CATEGORIES).map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="flex items-center border rounded-md shrink-0">
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

                            <div className="w-full sm:w-auto">
                                <TabsContent value="modules" className="m-0 border-0 p-0">
                                    <Button asChild className="w-full sm:w-auto">
                                        <Link href="/dashboard/create">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Yeni Modül
                                        </Link>
                                    </Button>
                                </TabsContent>
                                <TabsContent value="collections" className="m-0 border-0 p-0">
                                    <Button asChild className="w-full sm:w-auto">
                                        <Link href="/dashboard/collections/new">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Yeni Koleksiyon
                                        </Link>
                                    </Button>
                                </TabsContent>
                            </div>
                        </div>
                    </div>
                </div>

                <TabsContent value="modules" className="space-y-4 !mt-8">
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 max-w-[400px] mb-4">
                            <TabsTrigger value="all">Tümü</TabsTrigger>
                            <TabsTrigger value="created">Üretimlerim</TabsTrigger>
                            <TabsTrigger value="forked">Kaydedilenler</TabsTrigger>
                        </TabsList>

                        {isLoading ? (
                            <LibrarySkeleton viewMode={viewMode} />
                        ) : !filteredModules || filteredModules.length === 0 ? (
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
                        ) : (
                            <>
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
                            </>
                        )}
                    </Tabs>
                </TabsContent>

                <TabsContent value="collections" className="space-y-4">
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 max-w-[400px] mb-4">
                            <TabsTrigger value="all">Tümü</TabsTrigger>
                            <TabsTrigger value="created">Üretimlerim</TabsTrigger>
                            <TabsTrigger value="forked">Kaydedilenler</TabsTrigger>
                        </TabsList>

                        {isLoading ? (
                            <LibrarySkeleton viewMode={viewMode} />
                        ) : !filteredCollections || filteredCollections.length === 0 ? (
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
                        ) : (
                            <>
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
                            </>
                        )}
                    </Tabs>
                </TabsContent>

                <TabsContent value="ai-solutions" className="space-y-4">
                    {isLoadingSolutions ? (
                        <LibrarySkeleton viewMode={viewMode} />
                    ) : !aiSolutions || aiSolutions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-lg p-8 text-center">
                            <Brain className="h-10 w-10 text-muted-foreground opacity-50 mb-4" />
                            <h3 className="text-lg font-semibold">{dictionary.solvePhoto.noHistory}</h3>
                            <Button asChild className="mt-4">
                                <Link href="/dashboard/create/solve-photo">Soru Çözmeye Başla</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {aiSolutions.map((solution) => (
                                <Card key={solution.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="aspect-video relative bg-muted">
                                        {solution.imageUrl ? (
                                            <Image src={solution.imageUrl} alt="Soru" fill className="object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <FileText className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                    <CardHeader className="p-4">
                                        <CardTitle className="text-sm line-clamp-2 leading-snug">{solution.questionText}</CardTitle>
                                        <CardDescription className="text-[10px] mt-1 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(solution.createdAt).toLocaleDateString()}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardFooter className="p-4 pt-0">
                                        <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                                            <Link href={`/dashboard/create/solve-photo?id=${solution.id}`}>İncele</Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="notes" className="space-y-4">
                    {isLoadingNotes ? (
                        <LibrarySkeleton viewMode={viewMode} />
                    ) : !allNotes || allNotes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-lg p-8 text-center">
                            <FileText className="h-10 w-10 text-muted-foreground opacity-50 mb-4" />
                            <h3 className="text-lg font-semibold">{dictionary.library.notes.noNotes}</h3>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {allNotes.map((note) => (
                                <Card key={note.id} className="hover:border-primary/50 transition-colors">
                                    <CardHeader className="p-4 pb-2">
                                        <div className="flex items-center justify-between">
                                            <Badge variant="secondary" className="text-[10px]">
                                                {note.moduleId ? dictionary.library.notes.moduleNote : dictionary.library.notes.aiSolution}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground">
                                                {new Date(note.updatedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <CardTitle className="text-sm mt-2">{note.title || "Adsız Not"}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <p className="text-sm text-muted-foreground line-clamp-3">{note.content}</p>
                                        <div className="mt-3 text-[10px] font-medium text-primary flex items-center gap-1">
                                            <BookOpen className="h-3 w-3" />
                                            {note.module?.title || note.solvedQuestion?.questionText.substring(0, 30) + "..."}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div >
    );
}

// ModuleCard removed, imported from @/components/module/module-card

function LibrarySkeleton({ viewMode }: { viewMode: 'grid' | 'list' }) {
    return (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className={viewMode === 'grid' ? "h-[300px] w-full" : "h-[80px] w-full"} />
            ))}
        </div>
    );
}
