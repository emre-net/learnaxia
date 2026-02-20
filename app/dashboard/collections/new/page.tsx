"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowRight, ArrowLeft, FolderPlus, Info, BookOpen, Layers,
    Check, Search, AlertCircle, Loader2, RotateCw, Globe,
    Lock, Sparkles, Search as SearchIcon
} from "lucide-react";
import { CATEGORIES } from "@/lib/constants/categories";
import Link from "next/link";

export default function NewCollectionPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Step 1: Info State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [subCategory, setSubCategory] = useState("");
    const [isPublic, setIsPublic] = useState(false);

    // Step 2: Module Selection State
    const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [scope, setScope] = useState<"library" | "discover">("library");

    const { data: rawItems, isLoading, error, refetch } = useQuery<any[]>({
        queryKey: scope === 'library'
            ? ['library-modules', 'wizard'] // Unified with LibraryClient
            : ['collection-wizard-discover', searchQuery],
        queryFn: async () => {
            // Add timestamp to library requests to bypass intermediate caches
            const url = scope === 'discover'
                ? `/api/modules?scope=discover&search=${encodeURIComponent(searchQuery)}`
                : `/api/modules?v=${new Date().getTime()}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch modules');
            const data = await res.json();

            console.log(`[Wizard] API returned ${data.length} items for scope: ${scope}`);

            // Normalize data: If scope=library, data is UserModuleLibrary[]. If discover, it's Module[].
            return data.map((item: any) => {
                const module = item.module || item; // item.module for library, item for discover
                if (!module || !module.id) {
                    console.warn("[Wizard] Invalid item structure:", item);
                    return null;
                }
                return {
                    id: module.id,
                    title: module.title || "Başlıksız",
                    type: module.type || "MODÜL",
                    category: module.category,
                    owner: item.owner || module.owner || null,
                    _count: module._count
                };
            }).filter(Boolean);
        }
    });

    // Local filtering for library items (matches LibraryClient behavior)
    const libraryItems = (rawItems || []).filter(item => {
        if (scope === 'discover') return true; // Server already filtered
        const query = searchQuery.toLowerCase();
        return item.title.toLowerCase().includes(query) ||
            (item.category && item.category.toLowerCase().includes(query));
    });

    const handleNext = () => {
        if (step === 1) {
            if (!title.trim()) {
                toast({
                    title: "Hata",
                    description: "Lütfen bir başlık girin",
                    variant: "destructive"
                });
                return;
            }
            if (isPublic && (!category || !subCategory)) {
                toast({
                    title: "Eksik Bilgi",
                    description: "Herkese açık koleksiyonlar için kategori ve alt kategori seçimi zorunludur.",
                    variant: "destructive"
                });
                return;
            }
            setStep(2);
        }
    };

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
        } else {
            router.push("/dashboard/library");
        }
    };

    const toggleModule = (id: string) => {
        setSelectedModuleIds(prev =>
            prev.includes(id)
                ? prev.filter(mId => mId !== id)
                : [...prev, id]
        );
    };

    const finalizeCollection = async () => {
        if (!title.trim()) return;

        setIsSubmitting(true);
        try {
            // 1. Create the collection
            const res = await fetch('/api/collections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    category,
                    subCategory,
                    isPublic
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Koleksiyon oluşturulamadı');
            }

            const collection = await res.json();

            // 2. If modules selected, update the collection
            if (selectedModuleIds.length > 0) {
                const updateRes = await fetch(`/api/collections/${collection.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        moduleIds: selectedModuleIds
                    })
                });
                if (!updateRes.ok) throw new Error('Modüller eklenirken hata oluştu');
            }

            toast({
                title: "Başarılı",
                description: "Koleksiyon başarıyla oluşturuldu!"
            });
            router.push(`/dashboard/library`);
            router.refresh();
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Hata",
                description: error.message || "Bir hata oluştu",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-8">
                <Button variant="ghost" onClick={handleBack} className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Geri
                </Button>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-1">
                        <div className={cn("h-2.5 w-16 rounded-full transition-all duration-300", step >= 1 ? "bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-muted")} />
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider", step === 1 ? "text-primary" : "text-muted-foreground")}>Bilgi</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className={cn("h-2.5 w-16 rounded-full transition-all duration-300", step >= 2 ? "bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-muted")} />
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider", step === 2 ? "text-primary" : "text-muted-foreground")}>Modüller</span>
                    </div>
                </div>
                <div className="text-sm font-bold text-muted-foreground w-[60px] text-right">
                    {step}/2
                </div>
            </div>

            {step === 1 ? (
                <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-extrabold tracking-tight">Koleksiyon Oluştur</h1>
                        <p className="text-muted-foreground text-lg">Modüllerini bir araya getirerek profesyonel bir öğrenme yolu tasarla.</p>
                    </div>

                    <Card className="border-2 shadow-xl overflow-hidden backdrop-blur-sm bg-card/50">
                        <CardHeader className="border-b bg-muted/20 pb-6">
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <Info className="h-6 w-6 text-primary" /> Temel Bilgiler
                            </CardTitle>
                            <CardDescription className="text-base text-muted-foreground/80">Koleksiyonun için çekici bir başlık ve kategori seç.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="grid gap-2">
                                <label className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Başlık</label>
                                <Input
                                    placeholder="Örn: İleri Seviye Almanca Dilbilgisi"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="h-14 text-xl font-medium focus-visible:ring-primary/50"
                                />
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Açıklama (Opsiyonel)</label>
                                <Textarea
                                    placeholder="Bu koleksiyon ne hakkında? Diğer öğrencilerin ilgisini çek."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="min-h-[120px] resize-none text-base focus-visible:ring-primary/50"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-2">
                                <div className="grid gap-2">
                                    <label className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Kategori</label>
                                    <Select value={category} onValueChange={(val) => { setCategory(val); setSubCategory(""); }}>
                                        <SelectTrigger className="h-12 border-2">
                                            <SelectValue placeholder="Kategori Seç" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.keys(CATEGORIES).map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Alt Kategori</label>
                                    <Select value={subCategory} onValueChange={setSubCategory} disabled={!category}>
                                        <SelectTrigger className="h-12 border-2">
                                            <SelectValue placeholder="Alt Kategori Seç" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {category && (CATEGORIES as any)[category]?.map((sub: string) => (
                                                <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="pt-4 border-t flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <label className="text-base font-bold">Herkese Açık</label>
                                        <Badge variant="outline" className="text-[10px] uppercase">Önerilen</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Bu koleksiyon keşfet sayfasında görünebilir hale gelir.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-lg px-4 border border-border">
                                    {isPublic ? <Globe className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                                    <Switch
                                        checked={isPublic}
                                        onCheckedChange={setIsPublic}
                                    />
                                </div>
                            </div>

                            {isPublic && (!category || !subCategory) && (
                                <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 animate-in fade-in slide-in-from-top-2">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>Herkese açık koleksiyonlar için kategori seçimi zorunludur.</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end pt-6">
                        <Button
                            size="lg"
                            disabled={!title.trim()}
                            onClick={handleNext}
                            className="px-10 h-14 text-lg font-bold shadow-2xl shadow-primary/30 transition-all hover:scale-[1.05] active:scale-[0.98]"
                        >
                            Sonraki Adım <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-extrabold tracking-tight">Modülleri Seç</h1>
                        <p className="text-muted-foreground text-lg">Hangi modülleri bu koleksiyona eklemek istersin?</p>
                    </div>

                    <Card className="border-2 shadow-xl min-h-[600px] flex flex-col backdrop-blur-sm bg-card/50">
                        <CardHeader className="border-b bg-muted/20 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-2xl flex items-center gap-2">
                                        {scope === 'library' ? <Layers className="h-6 w-6 text-primary" /> : <Sparkles className="h-6 w-6 text-amber-500" />}
                                        {scope === 'library' ? 'Kitaplığım' : 'Keşfet'}
                                    </CardTitle>
                                    <CardDescription>Koleksiyona eklenecek modülleri seçin.</CardDescription>
                                </div>
                                <Badge variant="secondary" className="px-3 py-1 text-sm font-bold h-fit">
                                    {selectedModuleIds.length} Modül Seçildi
                                </Badge>
                            </div>

                            <Tabs value={scope} onValueChange={(val: any) => setScope(val)} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 h-12">
                                    <TabsTrigger value="library" className="text-sm font-bold">
                                        <Layers className="h-4 w-4 mr-2" /> Kitaplığım
                                    </TabsTrigger>
                                    <TabsTrigger value="discover" className="text-sm font-bold">
                                        <SearchIcon className="h-4 w-4 mr-2" /> Keşfet
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <div className="flex items-center justify-between gap-4 pt-2">
                                <div className="relative flex-1">
                                    <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={scope === 'library' ? "Kitaplığında ara..." : "Keşfette ara..."}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 h-11 border-2"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => refetch()}
                                    title="Yenile"
                                    className="h-11 w-11 shrink-0"
                                >
                                    <RotateCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                                </Button>
                            </div>

                            {error && (
                                <div className="text-[10px] text-red-500 opacity-50 flex items-center gap-2">
                                    <AlertCircle className="h-3 w-3" />
                                    Sunucu Hatası: {(error as any).message}
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-auto max-h-[500px]">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                    <p className="text-muted-foreground font-medium">Modüller yükleniyor...</p>
                                </div>
                            ) : libraryItems?.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                        <Search className="h-8 w-8 text-muted-foreground opacity-20" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Modül Bulunamadı</h3>
                                    <p className="text-muted-foreground max-w-xs mb-6">
                                        Bu alanda seçecek bir modül bulunmuyor. Yeni bir tane oluşturmaya ne dersin?
                                    </p>
                                    <div className="flex gap-3">
                                        <Button asChild variant="default">
                                            <Link href="/dashboard/create">Modül Oluştur</Link>
                                        </Button>
                                        <Button asChild variant="outline">
                                            <Link href="/dashboard/discover">Keşfet'i Gez</Link>
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {libraryItems?.map((item: any) => {
                                        const isSelected = selectedModuleIds.includes(item.id);
                                        return (
                                            <div
                                                key={item.id}
                                                className={cn(
                                                    "flex items-center gap-4 p-4 transition-colors cursor-pointer hover:bg-muted/30",
                                                    isSelected && "bg-primary/5"
                                                )}
                                                onClick={() => toggleModule(item.id)}
                                            >
                                                <div className={cn(
                                                    "h-6 w-6 rounded-md border-2 flex items-center justify-center transition-all",
                                                    isSelected ? "bg-primary border-primary shadow-sm" : "border-muted-foreground/30"
                                                )}>
                                                    {isSelected && <Check className="h-4 w-4 text-white" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold truncate text-base">{item.title}</h4>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                                                        <span className="flex items-center gap-1">
                                                            <BookOpen className="h-3 w-3" /> {item.type}
                                                        </span>
                                                        <span>•</span>
                                                        <span>{item.category || "Genel"}</span>
                                                        {item.owner && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="text-primary/70">@{item.owner.handle}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="p-6 bg-muted/10 border-t">
                            <p className="text-sm text-muted-foreground font-medium">
                                İpucu: Seçtiğin modüller otomatik olarak koleksiyona dahil edilir.
                            </p>
                        </CardFooter>
                    </Card>

                    <div className="flex justify-end pt-6">
                        <Button
                            size="lg"
                            onClick={finalizeCollection}
                            disabled={isSubmitting}
                            className="px-10 h-14 text-lg font-bold shadow-2xl shadow-primary/30 transition-all hover:scale-[1.05] active:scale-[0.98]"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Oluşturuluyor...
                                </>
                            ) : (
                                <>
                                    Koleksiyonu Oluştur <FolderPlus className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
            {/* Debug Section (Only visible during troubleshooting) */}
            <div className="mt-20 p-4 border-t border-dashed opacity-20 hover:opacity-100 transition-opacity">
                <details>
                    <summary className="text-xs font-mono cursor-pointer uppercase tracking-widest">Sistem Bilgileri (Hata Ayıklama)</summary>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-[10px] font-mono bg-muted p-4 rounded text-muted-foreground">
                        <div>
                            <p>Scope: {scope}</p>
                            <p>URL: {scope === 'discover' ? `/api/modules?scope=discover&search=${searchQuery}` : '/api/modules'}</p>
                            <p>Raw Items: {rawItems?.length || 0}</p>
                            <p>Filtered Items: {libraryItems?.length || 0}</p>
                        </div>
                        <div>
                            <p>Search Query: "{searchQuery}"</p>
                            <p>Loading: {isLoading ? "Evet" : "Hayır"}</p>
                            <p>Error: {error ? (error as any).message : "Yok"}</p>
                            <p>Time: {new Date().toLocaleTimeString()}</p>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-border/10">
                            <p>Raw Data Sample: {JSON.stringify(rawItems?.slice(0, 1), null, 2)}</p>
                        </div>
                    </div>
                </details>
            </div>
        </div>
    );
}
