"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Layers, BookCopy, Heart, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface LocalCollection {
    id: string;
    title: string;
    description: string | null;
    isPublic: boolean;
    ownerId: string;
    moduleIds: string[];
    category: string | null;
    subCategory: string | null;
    createdAt: string;
    updatedAt: string;
    owner: {
        handle: string | null;
    };
    _count?: {
        items?: number;
        userLibrary?: number;
    }
}

interface CollectionCardProps {
    item: {
        collection: LocalCollection;
        role: string;
        lastInteractionAt: string;
    };
    viewMode: 'grid' | 'list';
}

export function CollectionCard({ item, viewMode }: CollectionCardProps) {
    const { collection, role } = item;
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [saveCount, setSaveCount] = useState(collection._count?.userLibrary || 0);

    const moduleCount = collection._count?.items ?? collection.moduleIds?.length ?? 0;

    const handleSave = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsSaving(true);
        try {
            const res = await fetch(`/api/collections/${collection.id}/save`, { method: 'POST' });
            if (res.ok) {
                setSaveCount(prev => prev + 1);
                toast({ title: "Başarılı", description: "Koleksiyon kitaplığına kaydedildi." });
            }
        } catch (error) {
            toast({ title: "Hata", description: "İşlem başarısız.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    if (viewMode === 'list') {
        return (
            <Card className="flex flex-row items-center gap-4 p-4 hover:shadow-md transition-all group border-muted/50 rounded-xl">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Layers className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Link href={`/dashboard/collections/${collection.id}`} className="font-bold text-lg hover:underline truncate">
                            {collection.title}
                        </Link>
                        {collection.category && <Badge variant="secondary" className="text-[10px] h-5">{collection.category}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{collection.description || "Açıklama yok"}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={handleSave} disabled={isSaving} className="text-muted-foreground hover:text-red-500">
                        <Heart className="h-5 w-5" />
                    </Button>
                    <Link href={`/dashboard/collections/${collection.id}`}>
                        <Button variant="outline" size="sm" className="rounded-lg px-4 h-9">Görüntüle</Button>
                    </Link>
                </div>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col hover:shadow-xl transition-all duration-300 group h-full border-muted/50 hover:border-primary/20 bg-card overflow-hidden rounded-2xl cursor-pointer">
            <Link href={`/dashboard/collections/${collection.id}`} className="flex flex-col h-full">
                <CardHeader className="p-5 pb-3">
                    <div className="flex justify-between items-start gap-2">
                        <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                            <Layers className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary bg-primary/5 uppercase">KOLEKSİYON</Badge>
                            {role === 'OWNER' && <Badge variant="secondary" className="text-[10px] h-5">Sahibi</Badge>}
                        </div>
                    </div>
                    <CardTitle className="mt-3 leading-tight text-xl font-extrabold group-hover:text-primary transition-colors line-clamp-2">
                        {collection.title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pt-0 flex-grow">
                    <p className="text-sm text-muted-foreground line-clamp-3 min-h-[60px]">
                        {collection.description || "Bu koleksiyon için henüz bir açıklama girilmemiş."}
                    </p>
                </CardContent>
                <div className="px-5 py-3 border-y border-muted/30 flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                    <div className="flex items-center gap-1.5 uppercase tracking-wider">
                        <BookCopy className="h-3.5 w-3.5" />
                        <span>{moduleCount} MODÜL</span>
                    </div>
                    <div className="flex items-center gap-1.5 uppercase tracking-wider">
                        <Heart className="h-3.5 w-3.5 text-red-500" />
                        <span>{saveCount} KAYDEDİLME</span>
                    </div>
                </div>
                <CardFooter className="p-5 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 border-2 border-background shadow-sm">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">{collection.owner.handle?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-semibold text-muted-foreground">@{collection.owner.handle || "user"}</span>
                    </div>
                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl transition-all hover:bg-red-50 hover:text-red-500" onClick={handleSave} disabled={isSaving}>
                            <Heart className="h-4 w-4" />
                        </Button>
                        <Button variant="default" className="h-9 rounded-xl px-4 font-bold active:scale-95 transition-transform">
                            Aç <Play className="ml-1.5 h-3.5 w-3.5 fill-current" />
                        </Button>
                    </div>
                </CardFooter>
            </Link>
        </Card>
    );
}
