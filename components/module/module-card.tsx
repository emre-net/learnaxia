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
    const [isSaved, setIsSaved] = useState(module._count?.userLibrary ? module._count.userLibrary > 0 : false);

    const VerifiedBadge = () => (
        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-200 gap-1 px-1.5 h-5 font-bold">
            <CheckCircle2 className="h-3 w-3 fill-blue-600 text-white" />
            V
        </Badge>
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
            className="flex flex-col hover:shadow-xl transition-all duration-300 group h-full border-muted/50 hover:border-primary/20 bg-card overflow-hidden rounded-2xl cursor-pointer"
            onClick={() => setIsOptionsOpen(true)}
        >
            <div className="p-5 flex-grow space-y-4">
                <div className="flex justify-between items-start gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                        {getTypeIcon(module.type)}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary bg-primary/5 uppercase">{module.type}</Badge>
                        {module.isVerified && <VerifiedBadge />}
                    </div>
                </div>

                <div className="space-y-2">
                    <CardTitle className="leading-tight text-xl font-extrabold group-hover:text-primary transition-colors">
                        {module.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                        {module.description || "Bu modül için henüz bir açıklama girilmemiş."}
                    </p>
                </div>

                <div className="flex items-center gap-4 py-3 border-y border-muted/30">
                    <div className="flex flex-col gap-0.5" title="İçerik Sayısı">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                            <Layers className="h-3.5 w-3.5" />
                            <span>{module._count?.items || 0}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/60 uppercase font-medium">İçerik</span>
                    </div>

                    <div className="w-px h-8 bg-muted/30" />

                    <div className="flex flex-col gap-0.5" title="Çalışılma Sayısı">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                            <Play className="h-3.5 w-3.5 text-blue-500" />
                            <span>{module._count?.sessions || 0}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/60 uppercase font-medium">Çalışma</span>
                    </div>

                    <div className="w-px h-8 bg-muted/30" />

                    <div className="flex flex-col gap-0.5" title="Kaydedilme Sayısı">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                            <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span>{saveCount}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/60 uppercase font-medium">Kaydet</span>
                    </div>

                    <div className="w-px h-8 bg-muted/30" />

                    <div className="flex flex-col gap-0.5" title="Kopyalanma Sayısı">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                            <Copy className="h-3.5 w-3.5 text-orange-500" />
                            <span>{module._count?.forks || 0}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/60 uppercase font-medium">Kopya</span>
                    </div>
                </div>
            </div>

            <div className="p-5 pt-0 mt-auto flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className={`h-10 w-10 rounded-xl transition-all border-muted/50 ${isSaved ? 'bg-primary/10 text-primary border-primary/20' : 'hover:bg-primary/5 hover:text-primary'}`} onClick={handleSave} disabled={isSaving}>
                        <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-primary' : ''}`} />
                    </Button>
                    {!module.sourceModule && (
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl hover:bg-blue-50 hover:text-blue-500 transition-all border-muted/50" title="Kendi kütüphanene kopyalayarak özelleştir" onClick={handleFork}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                <Button className="h-10 rounded-xl px-5 font-bold shadow-sm hover:shadow-primary/20 transition-all">
                    Çalış <Play className="ml-2 h-4 w-4 fill-current" />
                </Button>
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
