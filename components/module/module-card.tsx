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
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { CardOwner } from "@/components/shared/card-owner";
import { VisibilityBadge } from "@/components/shared/visibility-badge";

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
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);

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

    if (viewMode === 'list') {
        return (
            <Card className="flex flex-row items-center gap-5 p-4 hover:shadow-xl hover:shadow-zinc-500/5 transition-all duration-300 group border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 rounded-2xl">
                <TypeIcon type={module.type} size="sm" />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Link href={`/dashboard/modules/${module.id}`} className="font-bold text-lg hover:text-blue-600 transition-colors truncate">
                            {module.title}
                        </Link>
                        {module.isVerified && <VerifiedBadge isTeam={module.owner?.handle === 'learnaxia'} />}
                    </div>
                    <div className="flex items-center gap-3">
                        <VisibilityBadge visibility={module.status === 'DRAFT' ? 'DRAFT' : module.visibility} className="h-5" />
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1">{module.description || "Açıklama yok"}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={handleSave} disabled={isSaving} className={`h-11 w-11 rounded-xl transition-all ${isSaved ? 'bg-primary/5 text-primary' : 'bg-muted/30 text-muted-foreground hover:bg-primary/5 hover:text-primary'}`}>
                        <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-primary' : ''}`} />
                    </Button>
                    <Button variant="default" className="h-11 rounded-xl px-6 font-bold" onClick={() => setIsOptionsOpen(true)}>Çalış</Button>
                </div>

                <Dialog open={isOptionsOpen} onOpenChange={setIsOptionsOpen}>
                    <DialogContent className="sm:max-w-md rounded-3xl" onClick={(e) => e.stopPropagation()}>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">{module.title}</DialogTitle>
                        </DialogHeader>
                        <StudyModeOptions />
                    </DialogContent>
                </Dialog>
            </Card>
        );
    }

    return (
        <Card
            className="flex flex-col hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 group h-full border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 overflow-hidden rounded-[2.5rem] cursor-pointer"
            onClick={() => setIsOptionsOpen(true)}
        >
            <div className="p-7 flex-grow space-y-5">
                <div className="flex justify-between items-start gap-4">
                    <TypeIcon type={module.type} size="md" className="group-hover:scale-110 transition-transform duration-500" />
                    <div className="flex items-center gap-2 pt-1">
                        <VisibilityBadge visibility={module.status === 'DRAFT' ? 'DRAFT' : module.visibility} className="h-6" />
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`h-11 w-11 rounded-2xl transition-all shadow-sm ${isSaved ? 'bg-primary/5 text-primary border border-primary/10' : 'bg-muted/40 text-muted-foreground hover:bg-primary/5 hover:text-primary border border-transparent'}`}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSave(); }}
                            disabled={isSaving}
                        >
                            <Bookmark className={`h-5.5 w-5.5 ${isSaved ? 'fill-primary' : ''}`} />
                        </Button>
                    </div>
                </div>

                <div className="space-y-3">
                    <CardTitle className="leading-tight text-2xl font-black text-zinc-900 dark:text-white group-hover:text-blue-600 transition-colors duration-300">
                        {module.title}
                    </CardTitle>
                    <p className="text-base text-zinc-500 dark:text-zinc-400 line-clamp-2 min-h-[48px] leading-relaxed">
                        {module.description || "Bu modül için henüz bir açıklama girilmemiş."}
                    </p>
                </div>

                <div className="flex items-center gap-6 py-5 border-y border-zinc-100 dark:border-zinc-800/50">
                    <div className="flex flex-col gap-1" title="İçerik Sayısı">
                        <div className="flex items-center gap-2.5 text-base font-bold text-zinc-800 dark:text-zinc-200">
                            <Layers className="h-4.5 w-4.5 text-blue-600" />
                            <span>{module._count?.items || 0}</span>
                            <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400 ml-0.5">
                                {module.type === 'FLASHCARD' ? 'Kart' : 'Soru'}
                            </span>
                        </div>
                    </div>

                    <div className="w-px h-10 bg-zinc-100 dark:bg-zinc-800" />

                    <div className="flex flex-col gap-1" title="Kaydedilme Sayısı">
                        <div className="flex items-center gap-2.5 text-base font-bold text-zinc-800 dark:text-zinc-200">
                            <Bookmark className={`h-4.5 w-4.5 ${isSaved ? 'text-primary' : 'text-zinc-400'}`} />
                            <span>{saveCount}</span>
                            <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400 ml-0.5">Kaydet</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                    <div className="flex items-center gap-2.5 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                        <Play className="h-3.5 w-3.5 text-indigo-500 fill-indigo-500/20" />
                        <span><span className="text-zinc-900 dark:text-zinc-100 font-black">{module._count?.sessions || 0}</span> kişi çalışıyor</span>
                    </div>
                    {/* Source Module Info */}
                    {module.sourceModule && (
                        <div className="flex items-center gap-2.5 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                            <Copy className="h-3.5 w-3.5 text-amber-500" />
                            <span>@{module.sourceModule.owner.handle} kaynağından</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-6 pt-2 mt-auto flex items-center justify-between gap-4 border-t border-zinc-50 dark:border-zinc-800/30 bg-zinc-50/30 dark:bg-zinc-900/20">
                <CardOwner
                    handle={module.owner?.handle || null}
                    image={module.owner?.image}
                    isVerified={module.isVerified}
                    isTeam={module.owner?.handle === 'learnaxia'}
                />

                <Button className="h-12 rounded-[1.25rem] px-8 font-black text-base shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 group/btn bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0" onClick={(e) => { e.stopPropagation(); setIsOptionsOpen(true); }}>
                    Çalış <Play className="ml-2 h-4 w-4 fill-current group-hover/btn:scale-110 transition-transform" />
                </Button>
            </div>

            <Dialog open={isOptionsOpen} onOpenChange={setIsOptionsOpen}>
                <DialogContent className="sm:max-w-md rounded-[2.5rem] border-zinc-200 dark:border-zinc-800 p-8" onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-zinc-900 dark:text-white mb-2">{module.title}</DialogTitle>
                        <DialogDescription className="text-zinc-500 dark:text-zinc-400 font-medium">Nasıl devam etmek istersiniz?</DialogDescription>
                    </DialogHeader>
                    <StudyModeOptions />
                </DialogContent>
            </Dialog>
        </Card>
    );
}
