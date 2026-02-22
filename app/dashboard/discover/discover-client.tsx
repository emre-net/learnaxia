
"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, X, Loader2, BookOpen, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CATEGORIES } from "@/lib/constants/categories";
import { ModuleCard } from "@/components/module/module-card";
import { CollectionCard } from "@/components/collection/collection-card";
import { Separator } from "@/components/ui/separator";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { useSettingsStore } from "@/stores/settings-store";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
// import { useDebounce } from "@/hooks/use-debounce"; // Removed: Using local implementation

// If useDebounce doesn't exist, I'll inline a simple effect or use local state with delay
// Let's check if useDebounce exists first. If not, I'll implement simple local debounce logic inside.

function useDebounceValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export function DiscoverClient() {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
    const [selectedModuleType, setSelectedModuleType] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("modules"); // 'modules' | 'collections'

    const [limit] = useState(12);
    const [page, setPage] = useState(0);

    const { language } = useSettingsStore();
    const dictionary = getDictionary(language);
    const studyDict = dictionary.study;

    const debouncedSearch = useDebounceValue(searchQuery, 300);

    // Reset page on filter change
    useEffect(() => {
        setPage(0);
    }, [activeTab, selectedCategory, selectedSubCategory, selectedModuleType, debouncedSearch]);

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['discover', activeTab, selectedCategory, selectedSubCategory, selectedModuleType, debouncedSearch, page],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (activeTab === "modules") params.set("type", "MODULE");
            else params.set("type", "COLLECTION");

            if (selectedCategory) params.set("category", selectedCategory);
            if (selectedSubCategory) params.set("subCategory", selectedSubCategory);
            if (selectedModuleType) params.set("moduleType", selectedModuleType);
            if (debouncedSearch) params.set("search", debouncedSearch);
            params.set("limit", limit.toString());
            params.set("offset", (page * limit).toString());

            const res = await fetch(`/api/discover?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch");
            return res.json();
        },
        staleTime: 30000
    });

    const items = data?.items || [];
    const total = data?.total || 0;
    const hasMore = items.length < total && total > limit;

    // Clear subcategory when category changes
    const handleCategorySelect = (cat: string) => {
        if (selectedCategory === cat) {
            setSelectedCategory(null);
            setSelectedSubCategory(null);
        } else {
            setSelectedCategory(cat);
            setSelectedSubCategory(null);
        }
    };

    const renderFilters = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="font-bold flex items-center gap-2 text-lg">
                    <Filter className="h-5 w-5 text-primary" /> Filtreler
                </div>
                {(selectedCategory || searchQuery || selectedModuleType) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => {
                            setSelectedCategory(null);
                            setSelectedSubCategory(null);
                            setSelectedModuleType(null);
                            setSearchQuery("");
                        }}
                    >
                        <X className="h-3 w-3 mr-1" /> Sıfırla
                    </Button>
                )}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="İçeriklerde ara..."
                    className="pl-10 bg-muted/30 border-none focus-visible:ring-1"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <Separator className="opacity-50" />

            {activeTab === "modules" && (
                <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 px-1">{studyDict?.moduleTypes?.title || "Modül Tipi"}</h3>
                    <div className="grid grid-cols-1 gap-1">
                        {[
                            { id: null, label: studyDict?.moduleTypes?.all || "Tümü" },
                            { id: "FLASHCARD", label: studyDict?.moduleTypes?.flashcard || "Kartlar" },
                            { id: "MC", label: studyDict?.moduleTypes?.mc || "Çoktan Seçmeli" },
                            { id: "TRUE_FALSE", label: studyDict?.moduleTypes?.true_false || "Doğru / Yanlış" },
                            { id: "GAP", label: studyDict?.moduleTypes?.gap || "Boşluk Doldurma" }
                        ].map((type) => (
                            <Button
                                key={type.id || 'all'}
                                variant={selectedModuleType === type.id ? "secondary" : "ghost"}
                                size="sm"
                                className={`w-full justify-start font-medium transition-all ${selectedModuleType === type.id ? 'bg-primary/10 text-primary hover:bg-primary/20' : ''}`}
                                onClick={() => setSelectedModuleType(type.id)}
                            >
                                {type.label}
                            </Button>
                        ))}
                    </div>
                    <Separator className="opacity-50 mt-4" />
                </div>
            )}

            <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 px-1">Kategoriler</h3>
                <ScrollArea className="h-[calc(100vh-350px)] pr-4">
                    <div className="space-y-1">
                        {Object.keys(CATEGORIES).map(cat => (
                            <div key={cat} className="space-y-1">
                                <Button
                                    variant={selectedCategory === cat ? "secondary" : "ghost"}
                                    size="sm"
                                    className={`w-full justify-start font-medium h-9 ${selectedCategory === cat ? 'bg-primary/10 text-primary' : ''}`}
                                    onClick={() => handleCategorySelect(cat)}
                                >
                                    {cat}
                                </Button>

                                {selectedCategory === cat && (
                                    <div className="ml-3 border-l-2 border-primary/20 pl-3 py-1 space-y-1 animate-in slide-in-from-left-2 duration-200">
                                        <Button
                                            variant={selectedSubCategory === null ? "secondary" : "ghost"}
                                            size="sm"
                                            className="w-full justify-start text-xs h-8"
                                            onClick={() => setSelectedSubCategory(null)}
                                        >
                                            Tümü
                                        </Button>
                                        {CATEGORIES[cat].map(sub => (
                                            <Button
                                                key={sub}
                                                variant={selectedSubCategory === sub ? "secondary" : "ghost"}
                                                size="sm"
                                                className={`w-full justify-start text-xs h-8 ${selectedSubCategory === sub ? 'text-primary font-bold' : ''}`}
                                                onClick={() => setSelectedSubCategory(sub === selectedSubCategory ? null : sub)}
                                            >
                                                {sub}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col md:flex-row h-full gap-8">
            {/* Sidebar (Desktop) */}
            <aside className="hidden md:block w-72 flex-shrink-0 space-y-6 border-r pr-8 h-fit sticky top-0">
                {renderFilters()}
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Keşfet</h1>
                                <p className="text-muted-foreground mt-1 text-lg">
                                    {selectedCategory
                                        ? `${selectedCategory} ${selectedSubCategory ? `> ${selectedSubCategory}` : ''}`
                                        : "Topluluk tarafından oluşturulan en yeni içerikler"}
                                </p>
                            </div>

                            {/* Mobile Filters Trigger */}
                            <div className="md:hidden">
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-2">
                                            <Filter className="h-5 w-5" />
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="left" className="w-[300px] sm:w-[350px] p-6">
                                        <SheetHeader className="px-0 mb-6">
                                            <SheetTitle>İçerikleri Filtrele</SheetTitle>
                                        </SheetHeader>
                                        {renderFilters()}
                                    </SheetContent>
                                </Sheet>
                            </div>
                        </div>

                        {searchQuery && (
                            <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-lg px-4 py-2 w-fit">
                                <span className="text-sm font-medium">"{searchQuery}" araması için sonuçlar</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 hover:bg-primary/10"
                                    onClick={() => setSearchQuery("")}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        )}
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2 scrollbar-hide">
                            <TabsList className="inline-flex h-12 items-center justify-center rounded-xl bg-muted/50 p-1 text-muted-foreground">
                                <TabsTrigger value="modules" className="rounded-lg px-8 py-2 text-sm font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Modüller</TabsTrigger>
                                <TabsTrigger value="collections" className="rounded-lg px-8 py-2 text-sm font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Koleksiyonlar</TabsTrigger>
                            </TabsList>

                            <div className="hidden sm:block text-sm text-muted-foreground font-medium">
                                <span className="text-foreground font-bold">{total}</span> içerik bulundu
                            </div>
                        </div>

                        <div className="space-y-8">
                            {isLoading && page === 0 ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="h-48 w-full bg-muted/20 animate-pulse rounded-2xl border border-dashed" />
                                    ))}
                                </div>
                            ) : items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed rounded-3xl p-12 text-center bg-muted/5">
                                    <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                                        <Search className="h-8 w-8 text-muted-foreground text-opacity-30" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Henüz Bir Şey Bulunmuyor</h3>
                                    <p className="text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
                                        Seçtiğiniz kriterlere uygun içerik şu an mevcut değil. Filtreleri değiştirerek tekrar deneyebilirsiniz.
                                    </p>
                                    <Button variant="outline" className="rounded-xl px-8" onClick={() => {
                                        setSelectedCategory(null);
                                        setSelectedSubCategory(null);
                                        setSelectedModuleType(null);
                                        setSearchQuery("");
                                    }}>Tüm Filtreleri Kaldır</Button>
                                </div>
                            ) : (
                                <div className="space-y-12">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        {activeTab === "modules" ? (
                                            items.map((item: any) => (
                                                <ModuleCard key={item.id} module={item} showOwner={true} />
                                            ))
                                        ) : (
                                            items.map((item: any) => (
                                                <CollectionCard
                                                    key={item.id}
                                                    item={{
                                                        role: 'VIEWER',
                                                        lastInteractionAt: item.createdAt,
                                                        collection: item
                                                    }}
                                                    viewMode="grid"
                                                />
                                            ))
                                        )}
                                    </div>

                                    {hasMore && (
                                        <div className="flex justify-center pb-20">
                                            <Button
                                                variant="outline"
                                                className="rounded-xl px-12 h-14 font-extrabold min-w-[240px] shadow-sm hover:shadow-md transition-all border-2"
                                                onClick={() => setPage(p => p + 1)}
                                                disabled={isFetching}
                                            >
                                                {isFetching ? (
                                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                                ) : (
                                                    <>
                                                        Daha Fazla Gör
                                                        <Separator orientation="vertical" className="mx-4 h-4 bg-foreground/20" />
                                                        <span className="text-xs text-muted-foreground font-medium">Kalan {total - items.length}</span>
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}
