
import { Module } from "@prisma/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckSquare, FileText, CheckCircle2, Pencil, MoreVertical, Layers, Clock, Copy, Play, Eye, RotateCw, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSettingsStore } from "@/stores/settings-store";
import { getStudyDictionary } from "@/lib/i18n/dictionaries";
import { useRouter } from "next/navigation";

// Type definition compatible with what we fetch
export type ModuleCardProps = {
    module: {
        id: string;
        title: string;
        description: string | null;
        type: string;
        status: string;
        isForkable: boolean;
        createdAt: string | Date;
        sourceModule?: {
            id: string;
            title: string;
            owner: { handle: string | null; name?: string | null; image?: string | null };
        } | null;
        owner?: { handle: string | null; image?: string | null };
        _count: { items: number };
    };
    solvedCount?: number;
    viewMode?: 'grid' | 'list';
    showOwner?: boolean; // New prop to show owner in Discover page
};

export function ModuleCard({ module, solvedCount = 0, viewMode = 'grid', showOwner = false }: ModuleCardProps) {
    const router = useRouter();
    const { language } = useSettingsStore();
    const dict = getStudyDictionary(language);
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'FLASHCARD': return <BookOpen className="h-5 w-5 text-blue-500" />;
            case 'MC': return <CheckSquare className="h-5 w-5 text-green-500" />;
            case 'GAP': return <FileText className="h-5 w-5 text-orange-500" />;
            case 'TRUE_FALSE': return <CheckCircle2 className="h-5 w-5 text-purple-500" />;
            default: return <BookOpen className="h-5 w-5 text-gray-500" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'FLASHCARD': return 'Kartlar';
            case 'MC': return 'Çoktan Seçmeli';
            case 'GAP': return 'Boşluk Doldurma';
            case 'TRUE_FALSE': return 'Doğru / Yanlış';
            default: return type;
        }
    };

    const handleCardClick = (e: React.MouseEvent) => {
        // Prevent click when clicking buttons inside
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
        setIsOptionsOpen(true);
    };

    const StudyModeOptions = () => (
        <div className="grid gap-3 pt-4">
            <Button className="w-full h-14 justify-start text-lg gap-3" onClick={() => router.push(`/study/${module.id}`)}>
                <Play className="h-6 w-6 fill-current" />
                {solvedCount > 0
                    ? (dict.moduleActions?.resumeStudy || "Çalışmaya Devam Et")
                    : (dict.moduleActions?.startStudy || "Çalışmaya Başla")
                }
            </Button>

            <Button variant="outline" className="w-full h-14 justify-start text-lg gap-3" onClick={() => router.push(`/dashboard/modules/${module.id}`)}>
                <Eye className="h-6 w-6" />
                {dict.moduleActions?.review || "Gözden Geçir"}
            </Button>

            <Button variant="secondary" className="w-full h-14 justify-start text-lg gap-3" onClick={() => router.push(`/study/${module.id}?mode=${module.type === 'FLASHCARD' ? 'SHUFFLE' : 'WRONG_ONLY'}`)}>
                {module.type === 'FLASHCARD' ? <RotateCw className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                {module.type === 'FLASHCARD'
                    ? (dict.moduleActions?.shuffle || "Karışık Tekrar")
                    : (dict.moduleActions?.focusMistakes || "Yanlışlara Odaklan")
                }
            </Button>
        </div>
    );

    if (viewMode === 'list') {
        return (
            <>
                <Card
                    className="flex flex-row items-center justify-between p-4 group hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={handleCardClick}
                >
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded bg-muted/50 flex items-center justify-center">
                            {getTypeIcon(module.type)}
                        </div>
                        <div>
                            <h3 className="font-semibold hover:text-primary">
                                {module.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="outline" className="text-xs font-normal h-5 px-1.5">{getTypeLabel(module.type)}</Badge>
                                <span className="line-clamp-1 border-l pl-2">{module.description || "Açıklama yok"}</span>
                                {showOwner && module.owner?.handle && (
                                    <span className="border-l pl-2 text-xs">by @{module.owner.handle}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            {module._count.items} öğe
                        </span>
                        <span className="hidden sm:inline-block">{new Date(module.createdAt).toLocaleDateString("tr-TR")}</span>
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            {!showOwner && (
                                <Button variant="ghost" size="icon" asChild>
                                    <Link href={`/dashboard/create/manual?edit=${module.id}`}>
                                        <Pencil className="h-4 w-4" />
                                    </Link>
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => setIsOptionsOpen(true)}>
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </Card>

                <Dialog open={isOptionsOpen} onOpenChange={setIsOptionsOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{module.title}</DialogTitle>
                            <DialogDescription>
                                {dict.moduleActions?.optionsTitle || "Çalışma Modu Seçin"}
                            </DialogDescription>
                        </DialogHeader>
                        <StudyModeOptions />
                    </DialogContent>
                </Dialog>
            </>
        )
    }

    return (
        <>
            <Card
                className="flex flex-col h-full hover:border-primary/50 transition-colors group relative overflow-hidden cursor-pointer"
                onClick={handleCardClick}
            >
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            {getTypeIcon(module.type)}
                            <Badge variant="outline">{getTypeLabel(module.type)}</Badge>
                        </div>
                        {module.status === 'DRAFT' && <Badge variant="secondary">Taslak</Badge>}
                    </div>
                    <CardTitle className="mt-2 group-hover:text-primary transition-colors leading-tight">
                        {module.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 min-h-[2.5rem] mt-1">
                        {module.description || "Açıklama girilmemiş."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-2">
                    <div className="h-24 bg-gradient-to-br from-muted/50 to-muted/10 rounded-md flex items-center justify-center text-muted-foreground/30 border border-dashed">
                        <span className="text-xs font-medium">Önizleme</span>
                    </div>
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground flex justify-between border-t py-3 bg-muted/5">
                    <span className="flex items-center gap-1 font-medium">
                        <Layers className="h-3 w-3" />
                        {module._count.items} Öğe
                    </span>
                    <div className="flex items-center gap-2">
                        {showOwner && module.owner?.handle && (
                            <span className="text-primary/80">@{module.owner.handle}</span>
                        )}
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(module.createdAt).toLocaleDateString("tr-TR")}
                        </span>
                    </div>
                </CardFooter>

                {!showOwner && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1" onClick={e => e.stopPropagation()}>
                        <Button variant="secondary" size="icon" className="h-8 w-8 shadow-sm" asChild>
                            <Link href={`/dashboard/create/manual?edit=${module.id}`}>
                                <Pencil className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                )}

                {module.sourceModule && (
                    <div className="absolute top-2 right-2 opacity-100 group-hover:opacity-0 transition-opacity">
                        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-xs h-6">
                            <Copy className="h-3 w-3 mr-1" />
                            @{module.sourceModule.owner.handle || "biri"}
                        </Badge>
                    </div>
                )}
            </Card>

            <Dialog open={isOptionsOpen} onOpenChange={setIsOptionsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{module.title}</DialogTitle>
                        <DialogDescription>
                            {dict.moduleActions?.optionsTitle || "Çalışma Modu Seçin"}
                        </DialogDescription>
                    </DialogHeader>
                    <StudyModeOptions />
                </DialogContent>
            </Dialog>
        </>
    );
}
