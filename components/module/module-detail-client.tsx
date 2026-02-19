"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Play, Plus, Edit, MoreVertical, Layers, ArrowRight, Copy, RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { ItemEditorSheet } from "@/components/create/item-editor-sheet";
import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Trash2 } from "lucide-react";

type ModuleDetail = {
    id: string;
    title: string;
    description: string | null;
    type: 'FLASHCARD' | 'MC' | 'GAP';
    status: string;
    isForkable: boolean;
    ownerId: string; // Added ownerId
    owner: { handle: string | null; name: string | null; image: string | null };
    sourceModule?: { id: string; title: string; owner: { handle: string | null; name: string | null } } | null;
    items: any[]; // Typed loosely for now
    createdAt: string;
};

export function ModuleDetailClient({ moduleId }: { moduleId: string }) {
    const router = useRouter();
    const { toast } = useToast(); // Use existing toast hook
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null); // To prepopulate sheet

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

    // Check ownership
    // Note: module.owner might be an object, we need ownerId or handle comparison.
    // The API response currently returns `owner` object. We should probably ask API to return `ownerId` too or compare handles if unique.
    // Let's assume we can compare handles if ID is missing, or better, update the API response type.
    // For now, let's assume `owner.handle` matches session user handle.
    // UPDATE: The useQuery type `ModuleDetail` has `owner`. We need `ownerId` in response for robust check.
    // Let's fetch it.


    const isOwner = session?.user?.id === module?.ownerId;

    const handleFork = async () => {
        if (!session) return;
        setIsForking(true);
        try {
            const res = await fetch(`/api/modules/${moduleId}/fork`, {
                method: 'POST',
            });

            if (!res.ok) throw new Error("Kopyalama başarısız");

            const newModule = await res.json();
            toast({
                title: "Başarılı",
                description: "Modül kopyalandı! Kütüphanenize eklendi.",
            });
            router.push(`/dashboard/modules/${newModule.id}`);
        } catch (error) {
            console.error(error);
            toast({
                title: "Hata",
                description: "Modül kopyalanırken bir hata oluştu.",
                variant: "destructive",
            });
        } finally {
            setIsForking(false);
        }
    };

    const handleSaveItem = async (item: any) => {
        try {
            const url = item.id && !item.id.includes('-') // Check if real ID (assuming UUID without dashes is not possible, but UUID has dashes. UUID v4 has dashes.)
            // Actually, item.id is set to uuidv4() in ItemEditorSheet for NEW items too.
            // But ItemEditorSheet's generatedId is passed to onSave.
            // We need to distinguish between "New Item (client-side ID)" and "Existing Item (database ID)".
            // BUT, `setEditingItem(item)` passes an existing DB item.
            // `ItemEditorSheet` uses that ID.
            // If it's a NEW item, ItemEditorSheet generates a UUID.
            // So BOTH have IDs.
            // We need to know if we are in "Edit Mode".
            // `editingItem` state tells us if we started from an existing item!
            // BUT `handleSaveItem` receives `item`, it doesn't know about `editingItem` state directly inside the closure if we assume it might lack context?
            // Actually it can access `editingItem`.
            // If `editingItem` is set, we are updating.

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

            await refetch();
            setIsSheetOpen(false);
            setEditingItem(null);
            toast({ title: "Başarılı", description: "Öğe eklendi" });
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
        <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Button variant="ghost" className="w-fit -ml-4" onClick={() => router.back()}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Kitaplığa Dön
                </Button>

                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline">{module.type}</Badge>
                            {module.status === 'DRAFT' && <Badge variant="secondary">Taslak</Badge>}
                            {isOwner && <Badge variant="default" className="bg-blue-600">Sahibi Sizsiniz</Badge>}
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">{module.title}</h1>
                        <p className="text-muted-foreground text-lg max-w-2xl">{module.description || "Açıklama girilmemiş."}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                            <span>Oluşturan: @{module.owner.handle || "kullanıcı"}</span>
                            {module.sourceModule && (
                                <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 text-muted-foreground/80">
                                        <Copy className="h-3 w-3" />
                                        Kaynak: @{module.sourceModule.owner.handle}
                                    </span>
                                </>
                            )}
                            <span>•</span>
                            <span>{new Date(module.createdAt).toLocaleDateString("tr-TR")}</span>
                            <span>•</span>
                            <span>{module.items.length} öğe</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {!isOwner && module.isForkable && (
                            <Button variant="secondary" onClick={handleFork} disabled={isForking}>
                                {isForking ? <RotateCw className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
                                Kitaplığına Ekle
                            </Button>
                        )}

                        {isOwner && (
                            <Button variant="outline" onClick={() => setIsSheetOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" /> Öğe Ekle
                            </Button>
                        )}

                        <Button size="lg" className="px-8 shadow-lg shadow-primary/20" asChild>
                            <Link href={`/study/${module.id}`}>
                                <Play className="mr-2 h-5 w-5 fill-current" /> Çalışmaya Başla
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Items List */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Layers className="h-5 w-5" /> Module Content
                </h2>

                {module.items.length === 0 ? (
                    <Card className="p-12 flex flex-col items-center justify-center text-center border-dashed">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Plus className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium mb-1">This module is empty</h3>
                        <p className="text-muted-foreground mb-4">Add your first item to start learning.</p>
                        <Button onClick={() => setIsSheetOpen(true)}>Add Item</Button>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {module.items.map((item, index) => (
                            <Card key={item.id} className="p-4 flex items-start gap-4 hover:border-primary/50 transition-colors group">
                                <div className="bg-muted h-8 w-8 rounded-md flex items-center justify-center font-mono text-sm shrink-0 mt-1">
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-lg mb-1">{item.content?.question || item.content?.front || "Untitled Item"}</p>
                                    <div className="text-muted-foreground flex items-center gap-2">
                                        <ArrowRight className="h-4 w-4" />
                                        <span className="line-clamp-1">
                                            {item.content?.answer || item.content?.back || (item.type === 'MC' ? 'Multiple Choice Options' : 'Content')}
                                        </span>
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => {
                                        setEditingItem(item);
                                        setIsSheetOpen(true);
                                    }}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteItem(item.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Sil
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
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
            />
        </div>
    );
}

function ModuleDetailSkeleton() {
    return (
        <div className="max-w-5xl mx-auto py-6 px-4 space-y-8">
            <div className="space-y-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-12 w-1/2" />
                <Skeleton className="h-6 w-full max-w-2xl" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        </div>
    )
}
