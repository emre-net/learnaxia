"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Layers, BookCopy, Bookmark, Play, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useSave } from "@/hooks/use-save";
import { LibraryCard, LibraryCardMetric } from "@/components/shared/library-card";
import { TypeIcon } from "@/components/shared/type-icon";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

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
    const queryClient = useQueryClient();
    const router = useRouter();
    const { data: session } = useSession();

    const isOwner = session?.user?.id === collection.ownerId;

    // Centralized Save Logic
    const { isSaved, saveCount, isSaving, handleSave } = useSave({
        id: collection.id,
        type: 'collection',
        initialSaved: typeof collection.isInLibrary !== 'undefined'
            ? collection.isInLibrary
            : (collection._count?.userLibrary ? collection._count.userLibrary > 0 : false),
        initialSaveCount: collection._count?.userLibrary || 0
    });


    const moduleCount = collection._count?.items ?? collection.moduleIds?.length ?? 0;

    const metrics: LibraryCardMetric[] = [
        {
            icon: <Layers className="h-4.5 w-4.5" />,
            count: moduleCount,
            label: 'Modül',
            isActive: true
        },
        {
            icon: <Bookmark className="h-4.5 w-4.5" />,
            count: saveCount,
            label: 'Kaydet',
            isActive: isSaved
        }
    ];

    const metadataItems: React.ReactNode[] = [];
    if (collection.category) {
        metadataItems.push(
            <Badge key="category" variant="secondary" className="bg-primary/5 text-primary border-primary/20 text-[10px] h-5 px-2">
                {collection.category}
            </Badge>
        );
    }

    const saveButton = (
        <Button
            variant="ghost"
            size="icon"
            className={`h-11 w-11 rounded-2xl transition-all shadow-sm ${isOwner ? 'opacity-40 cursor-not-allowed bg-muted/20 text-muted-foreground' :
                    isSaved ? 'bg-primary/5 text-primary border border-primary/10' :
                        'bg-muted/40 text-muted-foreground hover:bg-primary/5 hover:text-primary border border-transparent'
                }`}
            onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isOwner) handleSave();
            }}
            disabled={isSaving || isOwner}
            title={isOwner ? "Kendi içeriğinizi kaydedemezsiniz" : "Koleksiyonu Kaydet"}
        >
            <Bookmark className={`h-5.5 w-5.5 ${isSaved && !isOwner ? 'fill-primary' : ''}`} />
        </Button>
    );

    const actionButton = (
        <Button
            className="h-10 md:h-12 w-full xs:w-auto rounded-[1.25rem] px-6 md:px-8 font-black text-sm md:text-base shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 group/btn bg-primary text-white"
            onClick={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); router.push(`/dashboard/collections/${collection.id}`); }}
        >
            Aç <Play className="ml-2 h-4 w-4 fill-current group-hover/btn:scale-110 transition-transform" />
        </Button>
    );

    return (
        <LibraryCard
            viewMode={viewMode}
            typeIcon={<TypeIcon type="COLLECTION" size={viewMode === 'list' ? 'sm' : 'md'} />}
            visibility={collection.visibility}
            title={collection.title}
            description={collection.description || ""}
            metrics={metrics}
            metadata={metadataItems}
            owner={{
                handle: collection.owner.handle,
                image: null,
                isVerified: collection.isVerified,
                isTeam: collection.owner.handle === 'learnaxia'
            }}
            saveButton={saveButton}
            actionButton={viewMode === 'list' ? <Button variant="default" className="h-11 rounded-xl px-6 font-bold" onClick={(e: React.MouseEvent) => { e.stopPropagation(); router.push(`/dashboard/collections/${collection.id}`); }}>Aç</Button> : actionButton}
            onClick={() => router.push(`/dashboard/collections/${collection.id}`)}
        />
    );
}
