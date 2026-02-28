"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle2, FileText, CheckSquare, Pencil, MoreVertical, Layers, Clock, Copy, Play, Bookmark, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/i18n";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useSave } from "@/hooks/use-save";
import { TypeIcon, getModuleTypeLabel } from "@/components/shared/type-icon";
import { LibraryCard, LibraryCardMetric } from "@/components/shared/library-card";
import { useSession } from "next-auth/react";

export type ModuleCardProps = {
    module: {
        id: string;
        title: string;
        description: string | null;
        category: string | null;
        type: string;
        status: string;
        visibility: 'PUBLIC' | 'PRIVATE' | 'DRAFT' | any;
        isForkable: boolean;
        createdAt: string | Date;
        isVerified?: boolean;
        sourceModule?: {
            id: string;
            title: string;
            owner: { handle: string | null; name?: string | null; image?: string | null };
        } | null;
        ownerId: string;
        creatorId: string;
        owner?: { handle: string | null; image?: string | null };
        _count: { items: number; userLibrary?: number; forks?: number; sessions?: number };
        isInLibrary?: boolean;
    };
    solvedCount?: number;
    viewMode?: 'grid' | 'list';
    showOwner?: boolean;
};

export function ModuleCard({ module, solvedCount = 0, viewMode = 'grid', showOwner = false }: ModuleCardProps) {
    const router = useRouter();
    const { t } = useTranslation();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { data: session } = useSession();
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);

    const isOwner = session?.user?.id === module.ownerId || session?.user?.id === module.creatorId;

    // Centralized Save Logic
    const { isSaved, saveCount, isSaving, handleSave } = useSave({
        id: module.id,
        type: 'module',
        initialSaved: typeof module.isInLibrary !== 'undefined'
            ? module.isInLibrary
            : (module._count?.userLibrary ? module._count.userLibrary > 0 : false),
        initialSaveCount: module._count?.userLibrary || 0
    });




    const handleFork = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isOwner) return;

        try {
            const res = await fetch(`/api/modules/${module.id}/fork`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                // Invalidate queries so the library shows the new module
                queryClient.invalidateQueries({ queryKey: ['library-modules'] });

                toast({ title: "Modül Özelleştirildi", description: t('common.success') });
                router.push(`/dashboard/modules/${data.id}`);
            }
        } catch (error) {
            toast({ title: "Hata", description: t('common.error'), variant: "destructive" });
        }
    };

    const StudyModeOptions = () => (
        <div className="grid gap-3 pt-4">
            <Button className="w-full h-14 justify-start text-lg gap-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/10" onClick={() => router.push(`/study/${module.id}`)}>
                <Play className="h-6 w-6 fill-current" />
                {solvedCount > 0 ? t('study.moduleActions.resumeStudy') : t('study.moduleActions.startStudy')}
            </Button>
            <Button variant="outline" className="w-full h-14 justify-start text-lg gap-4 rounded-2xl border-2" onClick={() => router.push(`/dashboard/modules/${module.id}`)}>
                <BookOpen className="h-6 w-6" />
                {t('study.moduleActions.review')}
            </Button>
        </div>
    );

    const metrics: LibraryCardMetric[] = [
        {
            icon: <Layers className="h-4.5 w-4.5" />,
            count: module._count?.items || 0,
            label: module.type === 'FLASHCARD' ? 'Kart' : 'Soru',
            isActive: true
        },
        {
            icon: <Bookmark className="h-4.5 w-4.5" />,
            count: saveCount,
            label: 'Kaydet',
            isActive: isSaved
        }
    ];

    const metadataItems: React.ReactNode[] = [
        <div key="sessions" className="flex items-center gap-2">
            <Play className="h-3.5 w-3.5 text-indigo-500 fill-indigo-500/20" />
            <span><span className="text-zinc-900 dark:text-zinc-100 font-black">{module._count?.sessions || 0}</span> kişi çalışıyor</span>
        </div>
    ];

    if (module.sourceModule) {
        metadataItems.push(
            <div key="source" className="flex items-center gap-2">
                <Copy className="h-3.5 w-3.5 text-amber-500" />
                <span><span className="text-zinc-900 dark:text-zinc-100 font-bold">@{module.sourceModule.owner.handle}</span> kaynağından uyarlandı</span>
            </div>
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
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isOwner) handleSave();
            }}
            disabled={isSaving || isOwner}
            title={isOwner ? "Kendi içeriğinizi kaydedemezsiniz" : "Modülü Kaydet"}
        >
            <Bookmark className={`h-5.5 w-5.5 ${isSaved && !isOwner ? 'fill-primary' : ''}`} />
        </Button>
    );

    const actionButton = (
        <Button className="h-10 md:h-12 w-full xs:w-auto rounded-[1.25rem] px-6 md:px-8 font-black text-sm md:text-base shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 group/btn bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0" onClick={(e) => { e.stopPropagation(); setIsOptionsOpen(true); }}>
            Çalış <Play className="ml-2 h-4 w-4 fill-current group-hover/btn:scale-110 transition-transform" />
        </Button>
    );

    return (
        <>
            <LibraryCard
                viewMode={viewMode}
                typeIcon={<TypeIcon type={module.type} size={viewMode === 'list' ? 'sm' : 'md'} />}
                visibility={module.status === 'DRAFT' ? 'DRAFT' : module.visibility}
                title={module.title}
                description={module.description || ""}
                metrics={metrics}
                metadata={metadataItems}
                owner={showOwner ? module.owner : undefined}
                saveButton={saveButton}
                actionButton={viewMode === 'list' ? <Button variant="default" className="h-11 rounded-xl px-6 font-bold" onClick={(e) => { e.stopPropagation(); setIsOptionsOpen(true); }}>Çalış</Button> : actionButton}
                onClick={() => setIsOptionsOpen(true)}
            />

            <Dialog open={isOptionsOpen} onOpenChange={setIsOptionsOpen}>
                <DialogContent className="sm:max-w-md rounded-[2.5rem] border-zinc-200 dark:border-zinc-800 p-8" onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-zinc-900 dark:text-white mb-2">{module.title}</DialogTitle>
                        <DialogDescription className="text-zinc-500 dark:text-zinc-400 font-medium">Nasıl devam etmek istersiniz?</DialogDescription>
                    </DialogHeader>
                    <StudyModeOptions />
                </DialogContent>
            </Dialog>
        </>
    );
}
