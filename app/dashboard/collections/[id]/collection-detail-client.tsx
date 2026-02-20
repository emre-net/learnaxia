"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Layers, Play, BookOpen, Clock, ChevronLeft, Save, Copy } from "lucide-react";
import Link from "next/link";
import { ModuleCard } from "@/components/module/module-card";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

export function CollectionDetailClient({ collection }: { collection: any }) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/collections/${collection.id}/save`, { method: 'POST' });
            if (res.ok) {
                toast({ title: "Başarılı", description: "Koleksiyon kitaplığına kaydedildi." });
            }
        } catch (error) {
            toast({ title: "Hata", description: "İşlem gerçekleştirilemedi.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col gap-4">
                <Link href="/dashboard/discover" className="flex items-center text-sm text-muted-foreground hover:text-primary w-fit transition-colors">
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Keşfet'e Geri Dön
                </Link>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
                    <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Layers className="h-6 w-6" />
                            </div>
                            <Badge variant="outline" className="text-[10px] h-5 uppercase tracking-wider font-bold">Koleksiyon</Badge>
                            {collection.category && <Badge variant="secondary" className="text-[10px] h-5 capitalize">{collection.category}</Badge>}
                        </div>

                        <div className="space-y-1">
                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{collection.title}</h1>
                            <p className="text-muted-foreground text-lg max-w-2xl">{collection.description || "Bu koleksiyon için henüz bir açıklama girilmemiş."}</p>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <BookOpen className="h-4 w-4" />
                                <span>{collection.modules?.length || 0} Modül</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4" />
                                <span>{new Date(collection.createdAt).toLocaleDateString('tr-TR')}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className="p-0 font-normal border-none">@{collection.owner?.handle || "learnaxia"}</Badge>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 shrink-0">
                        <Button variant="outline" size="lg" className="h-12 px-6 rounded-xl transition-all hover:shadow-md" onClick={handleSave} disabled={isSaving}>
                            <Save className="mr-2 h-5 w-5" />
                            Kitaplığa Kaydet
                        </Button>
                        <Button size="lg" className="h-12 px-8 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-bold">
                            <Play className="mr-2 h-5 w-5 fill-current" />
                            Hepsini Çalış
                        </Button>
                    </div>
                </div>
            </div>

            {/* Modules Grid */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">Koleksiyon İçeriği</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {collection.modules?.map((module: any) => (
                        <ModuleCard key={module.id} module={module} viewMode="grid" />
                    ))}
                </div>
            </div>
        </div>
    );
}
