
import { Module } from "@prisma/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckSquare, FileText, CheckCircle2, Pencil, MoreVertical, Layers, Clock, Copy } from "lucide-react";
import Link from "next/link";

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
    viewMode?: 'grid' | 'list';
    showOwner?: boolean; // New prop to show owner in Discover page
};

export function ModuleCard({ module, viewMode = 'grid', showOwner = false }: ModuleCardProps) {
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

    if (viewMode === 'list') {
        return (
            <Card className="flex flex-row items-center justify-between p-4 group hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded bg-muted/50 flex items-center justify-center">
                        {getTypeIcon(module.type)}
                    </div>
                    <div>
                        <h3 className="font-semibold hover:underline cursor-pointer">
                            <Link href={`/dashboard/modules/${module.id}`}>{module.title}</Link>
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
                    <div className="flex gap-1">
                        {/* Only show Edit if NOT showing owner (meaning it's my library) OR if I am owner logic is handled upper */}
                        {!showOwner && (
                            <Button variant="ghost" size="icon" asChild>
                                <Link href={`/dashboard/create/manual?edit=${module.id}`}>
                                    <Pencil className="h-4 w-4" />
                                </Link>
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={`/dashboard/modules/${module.id}`}>
                                <MoreVertical className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Card className="flex flex-col h-full hover:border-primary/50 transition-colors group relative overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        {getTypeIcon(module.type)}
                        <Badge variant="outline">{getTypeLabel(module.type)}</Badge>
                    </div>
                    {module.status === 'DRAFT' && <Badge variant="secondary">Taslak</Badge>}
                </div>
                <CardTitle className="mt-2 group-hover:text-primary transition-colors leading-tight">
                    <Link href={`/dashboard/modules/${module.id}`} className="hover:underline underline-offset-4">
                        {module.title}
                    </Link>
                </CardTitle>
                <CardDescription className="line-clamp-2 min-h-[2.5rem] mt-1">
                    {module.description || "Açıklama girilmemiş."}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-2">
                {/* Visual Placeholder */}
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

            {/* Edit Button Overlay (Visible on Hover) - Only if NOT showOwner mode */}
            {!showOwner && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button variant="secondary" size="icon" className="h-8 w-8 shadow-sm" asChild>
                        <Link href={`/dashboard/create/manual?edit=${module.id}`}>
                            <Pencil className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            )}

            {/* Fork/Source Indicator */}
            {module.sourceModule && (
                <div className="absolute top-2 right-2 opacity-100 group-hover:opacity-0 transition-opacity">
                    <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-xs h-6">
                        <Copy className="h-3 w-3 mr-1" />
                        @{module.sourceModule.owner.handle || "biri"}
                    </Badge>
                </div>
            )}
        </Card>
    );
}
