
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

    const { language } = useSettingsStore();
    const dictionary = getDictionary(language);
    const studyDict = dictionary.study;

    const debouncedSearch = useDebounceValue(searchQuery, 500);

    const { data: results, isLoading, isError } = useQuery({
        queryKey: ['discover', activeTab, selectedCategory, selectedSubCategory, selectedModuleType, debouncedSearch],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (activeTab === "modules") params.set("type", "MODULE");
            else params.set("type", "COLLECTION");

            if (selectedCategory) params.set("category", selectedCategory);
            if (selectedSubCategory) params.set("subCategory", selectedSubCategory);
            if (selectedModuleType) params.set("moduleType", selectedModuleType);
            if (debouncedSearch) params.set("search", debouncedSearch);

            const res = await fetch(`/api/discover?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch");
            return res.json();
        },
        staleTime: 60000 // Cache for 1 minute
    });

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

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] gap-6">
            {/* Sidebar / Filters */}
            <aside className="w-full md:w-64 flex-shrink-0 space-y-6 md:border-r md:pr-6 overflow-y-auto h-full pb-10">
                <div className="space-y-4">
                    <div className="font-semibold flex items-center gap-2">
                        <Filter className="h-4 w-4" /> Filtreler
                    </div>

                    {/* Search Mobile/Desktop */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Ara..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Separator />

                    {activeTab === "modules" && (
                        <>
                            <div className="space-y-1">
                                <h3 className="text-sm font-medium mb-2 text-muted-foreground">{studyDict.moduleTypes?.title || "Modül Tipi"}</h3>
                                <div className="space-y-1">
                                    <Button
                                        variant={selectedModuleType === null ? "secondary" : "ghost"}
                                        size="sm"
                                        className="w-full justify-start font-normal"
                                        onClick={() => setSelectedModuleType(null)}
                                    >
                                        {studyDict.moduleTypes?.all || "Tümü"}
                                    </Button>
                                    <Button
                                        variant={selectedModuleType === "FLASHCARD" ? "secondary" : "ghost"}
                                        size="sm"
                                        className="w-full justify-start font-normal"
                                        onClick={() => setSelectedModuleType("FLASHCARD")}
                                    >
                                        {studyDict.moduleTypes?.flashcard || "Kartlar"}
                                    </Button>
                                    <Button
                                        variant={selectedModuleType === "MC" ? "secondary" : "ghost"}
                                        size="sm"
                                        className="w-full justify-start font-normal"
                                        onClick={() => setSelectedModuleType("MC")}
                                    >
                                        {studyDict.moduleTypes?.mc || "Çoktan Seçmeli"}
                                    </Button>
                                    <Button
                                        variant={selectedModuleType === "TRUE_FALSE" ? "secondary" : "ghost"}
                                        size="sm"
                                        className="w-full justify-start font-normal"
                                        onClick={() => setSelectedModuleType("TRUE_FALSE")}
                                    >
                                        {studyDict.moduleTypes?.true_false || "Doğru / Yanlış"}
                                    </Button>
                                    <Button
                                        variant={selectedModuleType === "GAP" ? "secondary" : "ghost"}
                                        size="sm"
                                        className="w-full justify-start font-normal"
                                        onClick={() => setSelectedModuleType("GAP")}
                                    >
                                        {studyDict.moduleTypes?.gap || "Boşluk Doldurma"}
                                    </Button>
                                </div>
                            </div>
                            <Separator />
                        </>
                    )}

                    <div className="space-y-1">
                        <h3 className="text-sm font-medium mb-2 text-muted-foreground">Kategoriler</h3>
                        <ScrollArea className="h-[400px] pr-3">
                            <div className="space-y-1">
                                {Object.keys(CATEGORIES).map(cat => (
                                    <div key={cat} className="space-y-1">
                                        <Button
                                            variant={selectedCategory === cat ? "secondary" : "ghost"}
                                            size="sm"
                                            className="w-full justify-start font-normal"
                                            onClick={() => handleCategorySelect(cat)}
                                        >
                                            {cat}
                                        </Button>

                                        {/* Subcategories (Accordion-like) */}
                                        {selectedCategory === cat && (
                                            <div className="ml-4 border-l pl-2 space-y-1 animate-in slide-in-from-left-2 duration-200">
                                                <Button
                                                    variant={selectedSubCategory === null ? "secondary" : "ghost"}
                                                    size="sm"
                                                    className="w-full justify-start text-xs h-7"
                                                    onClick={() => setSelectedSubCategory(null)}
                                                >
                                                    Tümü
                                                </Button>
                                                {CATEGORIES[cat].map(sub => (
                                                    <Button
                                                        key={sub}
                                                        variant={selectedSubCategory === sub ? "secondary" : "ghost"}
                                                        size="sm"
                                                        className="w-full justify-start text-xs h-7"
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
            </aside >

            {/* Main Content */}
            < main className="flex-1 overflow-y-auto pb-10" >
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Keşfet</h1>
                            <p className="text-muted-foreground">
                                {selectedCategory
                                    ? `${selectedCategory} ${selectedSubCategory ? `> ${selectedSubCategory}` : ''} alanındaki içerikler`
                                    : "Topluluk tarafından oluşturulan en yeni içerikler"}
                            </p>
                        </div>
                        {(selectedCategory || searchQuery || selectedModuleType) && (
                            <Button variant="ghost" size="sm" onClick={() => {
                                setSelectedCategory(null);
                                setSelectedSubCategory(null);
                                setSelectedModuleType(null);
                                setSearchQuery("");
                            }}>
                                <X className="h-4 w-4 mr-2" /> Filtreleri Temizle
                            </Button>
                        )}
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
                            <TabsTrigger value="modules">Modüller</TabsTrigger>
                            <TabsTrigger value="collections">Koleksiyonlar</TabsTrigger>
                        </TabsList>

                        <TabsContent value="modules" className="mt-0">
                            {isLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="h-[250px] w-full bg-muted/20 animate-pulse rounded-xl" />
                                    ))}
                                </div>
                            ) : isError ? (
                                <div className="text-center py-20 text-red-500">
                                    Bir hata oluştu. Lütfen tekrar deneyin.
                                </div>
                            ) : results?.items?.length === 0 ? (
                                <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-lg p-8 text-center bg-muted/5">
                                    <BookOpen className="h-10 w-10 text-muted-foreground opacity-50 mb-4" />
                                    <h3 className="text-lg font-semibold">Sonuç Bulunamadı</h3>
                                    <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                                        Bu kriterlere uygun modül bulunamadı. Filtreleri değiştirmeyi deneyin.
                                    </p>
                                    <Button variant="outline" onClick={() => {
                                        setSelectedCategory(null);
                                        setSelectedSubCategory(null);
                                        setSearchQuery("");
                                    }}>Tümünü Göster</Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in-50">
                                    {results?.items?.map((item: any) => (
                                        <ModuleCard key={item.id} module={item} showOwner={true} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="collections" className="mt-0">
                            {isLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="h-[250px] w-full bg-muted/20 animate-pulse rounded-xl" />
                                    ))}
                                </div>
                            ) : results?.items?.length === 0 ? (
                                <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-lg p-8 text-center bg-muted/5">
                                    <Layers className="h-10 w-10 text-muted-foreground opacity-50 mb-4" />
                                    <h3 className="text-lg font-semibold">Sonuç Bulunamadı</h3>
                                    <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                                        Bu kriterlere uygun koleksiyon bulunamadı.
                                    </p>
                                    <Button variant="outline" onClick={() => {
                                        setSelectedCategory(null);
                                        setSelectedSubCategory(null);
                                        setSearchQuery("");
                                    }}>Tümünü Göster</Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in-50">
                                    {results?.items?.map((item: any) => (
                                        // CollectionCard expects LibraryCollection wrapper type usually
                                        // But here we get raw Collection. We need to adapt or ensure CollectionCard handles raw collection.
                                        // Inspecting LibraryClient, it uses LibraryCollection type. 
                                        // CollectionCard props says `item: LibraryCollection`. 
                                        // Warning: This API returns raw collections. We need to mock the wrapper or update Component.
                                        // Let's wrap it to match LibraryCollection structure to avoid breaking `CollectionCard`.
                                        <CollectionCard
                                            key={item.id}
                                            item={{
                                                role: 'VIEWER',
                                                lastInteractionAt: item.createdAt,
                                                collection: item
                                            }}
                                            viewMode="grid"
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </main >
        </div >
    );
}

