"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft, FolderPlus, Info, BookOpen, Layers, Check, Search, AlertCircle, Loader2 } from "lucide-react";
import { CATEGORIES } from "@/lib/constants/categories";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

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

    // Step 2: Module Selection State
    const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    const { data: libraryItems, isLoading, error } = useQuery<any[]>({
        queryKey: ['library-modules'],
        queryFn: async () => {
            console.log("Fetching modules for collection wizard...");
            const res = await fetch('/api/modules');
            if (!res.ok) {
                console.error("Failed to fetch modules:", res.status);
                throw new Error('Failed to fetch modules');
            }
            const data = await res.json();
            console.log("Fetched modules count:", data?.length);
            return data;
        }
    });

    const filteredModules = libraryItems?.filter(item => {
        if (!item || !item.module) return false;
        const search = searchQuery.trim().toLowerCase();
        return item.module.title.toLowerCase().includes(search);
    });

    const handleNext = () => {
        if (step === 1 && title.trim()) {
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
        if (!title.trim()) {
            toast({
                title: "Hata",
                description: "Lütfen bir başlık girin",
                variant: "destructive"
            });
            return;
        }

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
                    isPublic: false
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
                                        <SelectTrigger className="h-12 border-2 text-foreground">
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
                                        <SelectTrigger className="h-12 border-2 text-foreground">
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
                        </CardContent>
                    </Card>

                    <div className="flex justify-end pt-6">
                        <Button size="lg" disabled={!title.trim()} onClick={handleNext} className="px-10 h-14 text-lg font-bold shadow-2xl shadow-primary/30 transition-all hover:scale-[1.05] active:scale-[0.98]">
                            Sonraki Adım <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-extrabold tracking-tight">Modülleri Seç</h1>
                        <p className="text-muted-foreground text-lg">Kitaplığından koleksiyona eklenecek modülleri işaretle.</p>
                    </div>

                    <Card className="border-2 shadow-xl min-h-[500px] flex flex-col backdrop-blur-sm bg-card/50">
                        <CardHeader className="border-b bg-muted/20 space-y-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-2xl">
                                    <Layers className="h-6 w-6 text-primary" /> Kitaplığın
                                </CardTitle>
                                <Badge variant="secondary" className="px-3 py-1 text-sm font-bold">
                                    {selectedModuleIds.length} Modül Seçildi
                                </Badge>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Modüllerde ara..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-10 border-2"
                                />
                                {/* Hidden Debug Info (Visible only if empty and has libraryItems) */}
                                {libraryItems && libraryItems.length > 0 && filteredModules?.length === 0 && (
                                    <div className="mt-2 text-[10px] text-muted-foreground opacity-30 overflow-hidden max-h-20">
                                        Debug: Items={libraryItems.length}, Raw={JSON.stringify(libraryItems[0]).slice(0, 100)}...
                                    </div>
                                )}
                                {libraryItems && libraryItems.length === 0 && (
                                    <div className="mt-2 text-[10px] text-muted-foreground opacity-30">
                                        Debug: API returned empty array.
                                    </div>
                                )}
                                {error && (
                                    <div className="mt-2 text-[10px] text-red-500 opacity-50">
                                        Debug Error: {(error as any).message}
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-auto max-h-[500px]">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                    <p className="text-muted-foreground font-medium">Modüller yükleniyor...</p>
                                </div>
                            ) : filteredModules?.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                                    <h3 className="text-lg font-bold">Modül Bulunamadı</h3>
                                    <p className="text-muted-foreground max-w-xs">Arama kriterlerine uygun modül yok veya kitaplığın boş.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {filteredModules?.map((item: any) => {
                                        const isSelected = selectedModuleIds.includes(item.moduleId);
                                        return (
                                            <div
                                                key={item.moduleId}
                                                className={cn(
                                                    "flex items-center gap-4 p-4 transition-colors cursor-pointer hover:bg-muted/30",
                                                    isSelected && "bg-primary/5"
                                                )}
                                                onClick={() => toggleModule(item.moduleId)}
                                            >
                                                <div className={cn(
                                                    "h-6 w-6 rounded-md border-2 flex items-center justify-center transition-all",
                                                    isSelected ? "bg-primary border-primary shadow-sm" : "border-muted-foreground/30"
                                                )}>
                                                    {isSelected && <Check className="h-4 w-4 text-white" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold truncate text-base">{item.module.title}</h4>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                                                        <span className="flex items-center gap-1">
                                                            <BookOpen className="h-3 w-3" /> {item.module.type}
                                                        </span>
                                                        <span>•</span>
                                                        <span>{item.module.category || "Genel"}</span>
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
                                İpucu: Modülleri seçtikten sonra sıralamayı koleksiyon detay sayfasından düzenleyebilirsin.
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
        </div>
    );
}
