"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getStudyDictionary } from "@/lib/i18n/dictionaries";
import { useSettingsStore } from "@/stores/settings-store";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Play, Plus, Edit, MoreVertical, Layers, ArrowRight, Copy, RotateCw, Clock, Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";
import { ItemEditorSheet } from "@/components/create/item-editor-sheet";
import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Trash2 } from "lucide-react";

import { TypeIcon } from "@/components/shared/type-icon";
import { VisibilityBadge } from "@/components/shared/visibility-badge";

type ModuleDetail = {
    id: string;
    title: string;
    description: string | null;
    type: 'FLASHCARD' | 'MC' | 'GAP' | 'TRUE_FALSE';
    status: string;
    visibility: string;
    isForkable: boolean;
    isInLibrary: boolean;
    ownerId: string;
    owner: { handle: string | null; name: string | null; image: string | null };
    sourceModule?: { id: string; title: string; owner: { handle: string | null; name: string | null } } | null;
    items: any[];
    createdAt: string;
};

export function ModuleDetailClient({ moduleId }: { moduleId: string }) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const { data: module, isLoading, error, refetch } = useQuery<ModuleDetail>({
        queryKey: ['module', moduleId],
        queryFn: async () => {
            const res = await fetch(`/api/modules/${moduleId}`);
            if (!res.ok) {
                if (res.status === 404) throw new Error("Module not found");
                throw new Error("Failed to fetch module");
            }
            return res.json();
        }
    });

    const { data: session } = useSession();
    const [isForking, setIsForking] = useState(false);

    const isOwner = session?.user?.id === module?.ownerId;
    const canSave = !isOwner && !module?.isInLibrary;

    const handleFork = async () => {
        if (!session) return;
        setIsForking(true);
        try {
            const res = await fetch(`/api/modules/${moduleId}/save`, {
                method: 'POST',
            });

            if (!res.ok) throw new Error("Kütüphaneye ekleme başarısız");

            toast({
                title: "Başarılı",
                description: "Modül kütüphanenize eklendi! Düzenleme yaparak kendi kopyanızı oluşturabilirsiniz.",
            });
            await refetch();
        } catch (error) {
            console.error(error);
            toast({
                title: "Hata",
                description: "Modül kütüphaneye eklenirken bir hata oluştu.",
                variant: "destructive",
            });
        } finally {
            setIsForking(false);
        }
    };

    const handleSaveItem = async (item: any) => {
        try {
            let method = 'POST';
            let endpoint = `/api/modules/${moduleId}/items`;

            if (editingItem) {
                method = 'PATCH';
                endpoint = `/api/modules/${moduleId}/items/${item.id}`;
            }

            const res = await fetch(endpoint, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });

            if (!res.ok) throw new Error("Failed to save item");

            const savedItem = await res.json();

            if (savedItem._meta?.forkedModuleId) {
                toast({ title: "Başarılı", description: "Modül fork edildi ve değişiklik uygulandı!" });
                router.push(`/dashboard/modules/${savedItem._meta.forkedModuleId}`);
                return;
            }

            await refetch();
            setIsSheetOpen(false);
            setEditingItem(null);
            toast({ title: "Başarılı", description: "Öğe güncellendi" });
        } catch (err) {
            console.error(err);
            toast({ title: "Hata", description: "Öğe eklenemedi", variant: "destructive" });
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm("Bu öğeyi silmek istediğinize emin misiniz?")) return;

        try {
            const res = await fetch(`/api/modules/${moduleId}/items/${itemId}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error("Failed to delete item");

            const result = await res.json();

            if (result.forkedModuleId) {
                toast({ title: "Başarılı", description: "Modül fork edildi ve öğe silindi!" });
                router.push(`/dashboard/modules/${result.forkedModuleId}`);
                return;
            }

            await refetch();
            toast({ title: "Başarılı", description: "Öğe silindi" });
        } catch (err) {
            console.error(err);
            toast({ title: "Hata", description: "Öğe silinemedi", variant: "destructive" });
        }
    };

    if (isLoading) return <ModuleDetailSkeleton />;
    if (error) return <div className="p-8 text-center text-red-500">Error loading module: {error.message}</div>;
    if (!module) return <div className="p-8 text-center">Module not found</div>;

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-10">
            {/* Header section with back navigation */}
            <div className="flex flex-col gap-6">
                <Button variant="ghost" className="w-fit -ml-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl" asChild>
                    <Link href="/dashboard/library">
                        <ChevronLeft className="mr-2 h-4 w-4" /> Kitaplığa Dön
                    </Link>
                </Button>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-1">
                    <div className="flex items-start gap-5">
                        <TypeIcon type={module.type} size="lg" className="mt-1 shadow-indigo-100 dark:shadow-none" />
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <VisibilityBadge visibility={module.status === 'DRAFT' ? 'DRAFT' : module.visibility} />
                                {module.isInLibrary && !isOwner && (
                                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-900/20 font-bold uppercase text-[10px] tracking-wider px-2.5 py-1 rounded-full">
                                        Kütüphanenizde
                                    </Badge>
                                )}
                                {isOwner && (
                                    <Badge variant="default" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 font-bold uppercase text-[10px] tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                                        Sahibi Sizsiniz
                                    </Badge>
                                )}
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight">
                                {module.title}
                            </h1>
                            <p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-2xl leading-relaxed">
                                {module.description || "Bu modül için bir açıklama girilmemiş."}
                            </p>

                            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm font-semibold text-zinc-500/80 pt-2">
                                <span className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                        <Edit className="h-3 w-3" />
                                    </div>
                                    @{module.owner.handle || "kullanıcı"}
                                </span>
                                {module.sourceModule && (
                                    <span className="flex items-center gap-2 text-zinc-400">
                                        <Copy className="h-3.5 w-3.5" />
                                        Kaynak: @{module.sourceModule.owner.handle}
                                    </span>
                                )}
                                <span className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                        <Layers className="h-3 w-3" />
                                    </div>
                                    {module.items.length} öğe
                                </span>
                                <span className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                        <Clock className="h-3 w-3" />
                                    </div>
                                    {new Date(module.createdAt).toLocaleDateString("tr-TR")}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-6 lg:pt-0">
                        {canSave && module.isForkable && (
                            <Button variant="secondary" onClick={handleFork} disabled={isForking} className="h-12 px-6 rounded-2xl font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-all active:scale-95 shadow-sm">
                                {isForking ? <RotateCw className="mr-2 h-4 w-4 animate-spin" /> : <Bookmark className="mr-2 h-4 w-4" />}
                                Kitaplığına Ekle
                            </Button>
                        )}

                        {(isOwner || module.isForkable) && (
                            <Button variant="outline" onClick={() => {
                                setEditingItem(null);
                                setIsSheetOpen(true);
                            }} className="h-12 px-6 rounded-2xl font-bold border-2 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all shadow-sm">
                                <Plus className="mr-2 h-4 w-4" /> Öğe Ekle
                            </Button>
                        )}

                        <Button size="lg" className="h-12 px-8 rounded-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-500/20 transition-all active:scale-95" asChild>
                            <Link href={`/study/${module.id}`}>
                                <Play className="mr-2 h-5 w-5 fill-current" /> Çalışmaya Başla
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content Divider */}
            <div className="h-px bg-zinc-200/60 dark:bg-zinc-800/60" />

            {/* Items List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-3 text-zinc-800 dark:text-zinc-100">
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                            <Layers className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        Modül İçeriği
                    </h2>
                </div>

                {module.items.length === 0 ? (
                    <Card className="p-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-3xl">
                        <div className="h-20 w-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6 shadow-inner">
                            <Layers className="h-10 w-10 text-zinc-400" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">Bu modül henüz boş</h3>
                        <p className="text-zinc-500 max-w-xs mb-8">Öğrenmeye başlamak için ilk öğenizi ekleyerek içeriği oluşturun.</p>
                        {(isOwner || module.isForkable) && (
                            <Button onClick={() => {
                                setEditingItem(null);
                                setIsSheetOpen(true);
                            }} size="lg" className="rounded-2xl px-8 font-bold">
                                İlk Öğeyi Ekle
                            </Button>
                        )}
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {module.items.map((item, index) => (
                            <Card key={item.id} className="p-5 flex items-start gap-4 hover:border-indigo-400/50 dark:hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                                <div className="bg-zinc-100 dark:bg-zinc-800 h-10 w-10 rounded-xl flex items-center justify-center font-bold text-zinc-500 dark:text-zinc-400 shrink-0 mt-1 shadow-sm border border-zinc-200/50 dark:border-zinc-700/50">
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0 py-1">
                                    <h4 className="font-bold text-xl text-zinc-900 dark:text-zinc-100 mb-2 leading-snug">
                                        {item.content?.question || item.content?.front || item.content?.statement || "Başlıksız Öğe"}
                                    </h4>
                                    <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 font-medium bg-zinc-50 dark:bg-zinc-800/30 w-fit px-3 py-1.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                        <ArrowRight className="h-4 w-4 text-indigo-500" />
                                        <span className="line-clamp-1">
                                            {item.content?.answer || item.content?.back || (item.type === 'MC' ? 'Seçenekler' : 'İçerik')}
                                        </span>
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 pl-4">
                                    {(isOwner || module.isForkable) && (
                                        <>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20" onClick={() => {
                                                setEditingItem(item);
                                                setIsSheetOpen(true);
                                            }}>
                                                <Edit className="h-5 w-5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20" onClick={() => handleDeleteItem(item.id)}>
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <ItemEditorSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                onSave={handleSaveItem}
                type={module.type}
                initialData={editingItem}
            />
        </div>
    );
}

function ModuleDetailSkeleton() {
    return (
        <div className="max-w-5xl mx-auto py-12 px-4 space-y-12">
            <div className="space-y-6">
                <Skeleton className="h-10 w-32 rounded-xl" />
                <div className="flex gap-6">
                    <Skeleton className="h-14 w-14 rounded-2xl" />
                    <div className="flex-1 space-y-4">
                        <Skeleton className="h-12 w-1/2 rounded-xl" />
                        <Skeleton className="h-6 w-3/4 rounded-lg" />
                    </div>
                </div>
            </div>
            <div className="space-y-4">
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-28 w-full rounded-2xl" />
            </div>
        </div>
    );
}
