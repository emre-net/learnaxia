"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle2, FileText, CheckSquare, Pencil, MoreVertical, Layers, Clock, Copy, Play, Bookmark } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/i18n";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

export type ModuleCardProps = {
    module: {
        id: string;
        title: string;
        description: string | null;
        category: string | null;
        type: string;
        status: string;
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
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveCount, setSaveCount] = useState(module._count?.userLibrary || 0);
    const [isSaved, setIsSaved] = useState(
        typeof module.isInLibrary !== 'undefined'
            ? module.isInLibrary
            : (module._count?.userLibrary ? module._count.userLibrary > 0 : false)
    );

    const VerifiedBadge = ({ isTeam = false }: { isTeam?: boolean }) => (
        <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${isTeam
                ? "bg-blue-600/10 text-blue-600 border-blue-200"
                : "bg-green-600/10 text-green-600 border-green-200"
                }`}
            title={isTeam ? "Bu modül Learnaxia ekibi tarafından doğrulanmıştır" : "Doğrulanmış İçerik"}
        >
            <CheckCircle2 className={`h-3 w-3 ${isTeam ? "fill-blue-600 text-white" : "fill-green-600 text-white"}`} />
            <span>{isTeam ? "LEARNAXIA ONAYLI" : "DOĞRULANMIŞ"}</span>
        </div>
    );

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'FLASHCARD': return <BookOpen className="h-5 w-5 text-blue-500" />;
            case 'MC': return <CheckSquare className="h-5 w-5 text-green-500" />;
            case 'GAP': return <FileText className="h-5 w-5 text-orange-500" />;
            case 'TRUE_FALSE': return <CheckCircle2 className="h-5 w-5 text-purple-500" />;
            default: return <BookOpen className="h-5 w-5 text-gray-500" />;
        }
    };

    const handleSave = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSaving) return;

        setIsSaving(true);
        try {
            const method = isSaved ? 'DELETE' : 'POST';
            const res = await fetch(`/api/modules/${module.id}/save`, { method });

            if (res.ok) {
                const newSavedState = !isSaved;
                setIsSaved(newSavedState);
                setSaveCount(prev => newSavedState ? prev + 1 : Math.max(0, prev - 1));

                toast({
                    title: "Başarılı",
                    description: newSavedState ? "Modül kitaplığına kaydedildi." : "Modül kitaplığından kaldırıldı."
                });
            }
        } catch (error) {
            toast({ title: "Hata", description: "İşlem gerçekleştirilemedi.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleFork = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const res = await fetch(`/api/modules/${module.id}/fork`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                toast({ title: "Modül Kopyalandı", description: "İlerlemenle birlikte kendi kütüphanene eklendi. Artık istediğin gibi düzenleyebilirsin!" });
                router.push(`/dashboard/modules/${data.id}`);
            }
        } catch (error) {
            toast({ title: "Hata", description: "Kopyalama işlemi başarısız.", variant: "destructive" });
        }
    };

    const StudyModeOptions = () => (
        <div className="grid gap-3 pt-4">
            <Button className="w-full h-14 justify-start text-lg gap-3" onClick={() => router.push(`/study/${module.id}`)}>
                <Play className="h-6 w-6 fill-current" />
                {solvedCount > 0 ? t('study.moduleActions.resumeStudy') : t('study.moduleActions.startStudy')}
            </Button>
            <Button variant="outline" className="w-full h-14 justify-start text-lg gap-3" onClick={() => router.push(`/dashboard/modules/${module.id}`)}>
                <BookOpen className="h-6 w-6" />
                {t('study.moduleActions.review')}
            </Button>
        </div>
    );

    if (viewMode === 'list') {
        return (
            <Card className="flex flex-row items-center gap-4 p-4 hover:shadow-md transition-all group border-muted/50">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    {getTypeIcon(module.type)}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Link href={`/dashboard/modules/${module.id}`} className="font-bold text-lg hover:underline truncate">
                            {module.title}
                        </Link>
                        {module.isVerified && <VerifiedBadge />}
                        {module.category && <Badge variant="secondary" className="text-[10px] h-5">{module.category}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{module.description || "Açıklama yok"}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={handleSave} disabled={isSaving} className={`transition-all ${isSaved ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                        <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-primary' : ''}`} />
                    </Button>
                    <Button variant="default" onClick={() => setIsOptionsOpen(true)}>Çalış</Button>
                </div>

                <Dialog open={isOptionsOpen} onOpenChange={setIsOptionsOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{module.title}</DialogTitle>
                        </DialogHeader>
                        <StudyModeOptions />
                    </DialogContent>
                </Dialog>
            </Card>
        );
    }

    return (
        <Card
            className="flex flex-col hover:shadow-2xl transition-all duration-300 group h-full border-muted/50 hover:border-primary/20 bg-card overflow-hidden rounded-[2rem] cursor-pointer"
            onClick={() => setIsOptionsOpen(true)}
        >
            <div className="p-5 flex-grow space-y-4">
                <div className="flex justify-between items-center gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-all duration-300 border border-transparent group-hover:border-primary/20">
                            {getTypeIcon(module.type)}
                        </div>
                        {module.isVerified && <VerifiedBadge isTeam={module.owner?.handle === 'learnaxia'} />}
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
                        {module.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                        {module.description || "Bu modül için henüz bir açıklama girilmemiş."}
                    </p>
                </div>

                <div className="flex items-center gap-6 py-4 border-y border-muted/20">
                    <div className="flex flex-col gap-1" title="İçerik Sayısı">
                        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                            <Layers className="h-4 w-4 text-primary" />
                            <span>{module._count?.items || 0}</span>
                            <span className="text-xs font-medium text-muted-foreground ml-0.5">
                                {module.type === 'FLASHCARD' ? 'Kart' : 'Soru'}
                            </span>
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

                <div className="flex flex-col gap-1.5 pt-1">
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground/80">
                        <Play className="h-3 w-3 text-blue-500 fill-blue-500/20" />
                        <span>Bu modülü <span className="text-foreground">{module._count?.sessions || 0}</span> kişi çalışıyor</span>
                    </div>
                    {(module._count?.forks || 0) > 0 && (
                        <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground/80">
                            <Copy className="h-3 w-3 text-orange-500" />
                            <span><span className="text-foreground">{module._count?.forks}</span> kişi kütüphanesine ekleyerek özelleştirdi</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-5 pt-3 mt-auto flex items-center justify-between gap-3 border-t border-muted/20">
                <div className="flex items-center gap-2">
                    {!module.sourceModule && (
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 rounded-2xl hover:bg-blue-50 hover:text-blue-500 transition-all border-muted/50 shadow-sm"
                            title="Kendi kütüphanene kopyalayarak özelleştir"
                            onClick={handleFork}
                        >
                            <Pencil className="h-4.5 w-4.5" />
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-4 pr-1">
                    {module.owner?.handle === 'learnaxia' ? (
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20 shadow-inner">
                                <Layers className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-[13px] font-bold text-primary tracking-tight">Learnaxia Ekibi</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-muted-foreground/10 shadow-inner grayscale-[0.5] group-hover:grayscale-0 transition-all">
                                {module.owner?.image ? (
                                    <img src={module.owner.image} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-xs uppercase font-bold text-muted-foreground">{(module.owner?.handle?.[0] || 'U')}</span>
                                )}
                            </div>
                            <span className="text-[13px] font-bold text-muted-foreground transition-colors group-hover:text-foreground">@{module.owner?.handle || 'user'}</span>
                        </div>
                    )}
                    <Button className="h-11 rounded-2xl px-6 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all group/btn">
                        Çalış <Play className="ml-2 h-4 w-4 fill-current group-hover/btn:scale-110 transition-transform" />
                    </Button>
                </div>
            </div>

            <Dialog open={isOptionsOpen} onOpenChange={setIsOptionsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{module.title}</DialogTitle>
                        <DialogDescription>{t('study.moduleActions.optionsTitle')}</DialogDescription>
                    </DialogHeader>
                    <StudyModeOptions />
                </DialogContent>
            </Dialog>
        </Card>
    );
}
