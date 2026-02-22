"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Layers, BookCopy, Bookmark, Play, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useSave } from "@/hooks/use-save";

interface LocalCollection {
    id: string;
    title: string;
    description: string | null;
    visibility: 'PUBLIC' | 'PRIVATE';
    ownerId: string;
    moduleIds: string[];
    category: string | null;
    subCategory: string | null;
    isVerified?: boolean;
    createdAt: string;
    updatedAt: string;
    owner: {
        handle: string | null;
    };
    _count?: {
        items?: number;
        userLibrary?: number;
    };
    isInLibrary?: boolean;
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
    const queryClient = useQueryClient();

    // Centralized Save Logic
    const { isSaved, saveCount, isSaving, handleSave } = useSave({
        id: collection.id,
        type: 'collection',
        initialSaved: typeof collection.isInLibrary !== 'undefined'
            ? collection.isInLibrary
            : (collection._count?.userLibrary ? collection._count.userLibrary > 0 : false),
        initialSaveCount: collection._count?.userLibrary || 0
    });

    const VerifiedBadge = ({ isTeam = false }: { isTeam?: boolean }) => (
        <div
            title={isTeam ? "Bu koleksiyon Learnaxia ekibi tarafından doğrulanmıştır" : "Doğrulanmış İçerik"}
            className="flex items-center"
        >
            <CheckCircle2 className={`h-3.5 w-3.5 ${isTeam ? "text-blue-600 fill-blue-500/10" : "text-green-600 fill-green-500/10"}`} />
        </div>
    );

    const moduleCount = collection._count?.items ?? collection.moduleIds?.length ?? 0;


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
                        {collection.isVerified && <VerifiedBadge isTeam={collection.owner?.handle === 'learnaxia'} />}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{collection.description || "Açıklama yok"}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`transition-all ${isSaved ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                    >
                        <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-primary' : ''}`} />
                    </Button>
                    <Link href={`/dashboard/collections/${collection.id}`}>
                        <Button variant="default">Aç</Button>
                    </Link>
                </div>
            </Card>
        );
    }

    return (
        <Card
            className="flex flex-col hover:shadow-2xl transition-all duration-300 group h-full border-muted/50 hover:border-primary/20 bg-card overflow-hidden rounded-[2rem] cursor-pointer"
        >
            <div className="p-5 flex-grow space-y-4">
                <div className="flex justify-between items-center gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-all duration-300 border border-transparent group-hover:border-primary/20">
                            <Layers className="h-6 w-6 text-primary" />
                        </div>
                        <Badge variant="outline" className={`text-[10px] font-bold border-primary/20 bg-primary/5 uppercase ${collection.visibility === 'PRIVATE' ? 'text-orange-500 border-orange-500/20 bg-orange-50' : 'text-primary'}`}>
                            {collection.visibility === 'PRIVATE' ? 'GİZLİ KOLEKSİYON' : 'KAMU KOLEKSİYONU'}
                        </Badge>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`h-11 w-11 rounded-2xl transition-all ${isSaved ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-muted/30 text-muted-foreground hover:bg-primary/10 hover:text-primary'}`}
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-primary' : ''}`} />
                    </Button>
                </div>

                <div className="space-y-2">
                    <CardTitle className="leading-tight text-xl font-extrabold group-hover:text-primary transition-colors">
                        {collection.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                        {collection.description || "Bu koleksiyon için henüz bir açıklama girilmemiş."}
                    </p>
                </div>

                <div className="flex items-center gap-6 py-4 border-y border-muted/20">
                    <div className="flex flex-col gap-1" title="Modül Sayısı">
                        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                            <Layers className="h-4 w-4 text-primary" />
                            <span>{moduleCount}</span>
                            <span className="text-xs font-medium text-muted-foreground ml-0.5">Modül</span>
                        </div>
                    </div>

                    <div className="w-px h-10 bg-muted/20" />

                    <div className="flex flex-col gap-1" title="Kaydedilme Sayısı">
                        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                            <Bookmark className={`h-4 w-4 ${isSaved ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span>{saveCount}</span>
                            <span className="text-xs font-medium text-muted-foreground ml-0.5">Kaydet</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-5 pt-3 mt-auto flex items-center justify-between gap-3 border-t border-muted/20">
                <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8 rounded-lg border border-muted-foreground/10 shadow-inner grayscale-[0.5] group-hover:grayscale-0 transition-all">
                        <AvatarImage src={""} />
                        <AvatarFallback className="text-xs uppercase font-bold text-muted-foreground bg-muted">{collection.owner.handle?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[13px] font-bold text-muted-foreground transition-colors group-hover:text-foreground">
                            {collection.owner.handle === 'learnaxia' ? 'Learnaxia Ekibi' : `@${collection.owner.handle || 'user'}`}
                        </span>
                        {collection.isVerified && <VerifiedBadge isTeam={collection.owner.handle === 'learnaxia'} />}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/collections/${collection.id}`} className="contents">
                        <Button className="h-11 rounded-2xl px-6 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all group/btn">
                            Aç <Play className="ml-2 h-4 w-4 fill-current group-hover/btn:scale-110 transition-transform" />
                        </Button>
                    </Link>
                </div>
            </div>
        </Card>
    );
}
