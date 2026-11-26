"use client";

import { useState } from "react";
import { Brain, FileText, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

interface AiSolutionsTabProps {
    solutions: any[] | undefined;
    isLoading: boolean;
    viewMode: 'grid' | 'list';
    dictionary: any;
}

export function AiSolutionsTab({
    solutions,
    isLoading,
    viewMode,
    dictionary
}: AiSolutionsTabProps) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            const res = await fetch(`/api/solved-questions/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            await queryClient.invalidateQueries({ queryKey: ["ai-solutions"] });
            toast({ title: "Silindi", description: "AI çözümü kaldırıldı." });
        } catch {
            toast({ title: "Hata", description: "Çözüm silinemedi.", variant: "destructive" });
        } finally {
            setDeletingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className={viewMode === 'grid' ? "h-[300px] w-full" : "h-[80px] w-full"} />
                ))}
            </div>
        );
    }

    if (!solutions || solutions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[360px] border border-dashed border-zinc-800 bg-[#121215]/70 rounded-2xl p-8 text-center">
                <Brain className="h-10 w-10 text-zinc-500 mb-4" />
                <h3 className="text-lg font-semibold text-zinc-100">{dictionary.solvePhoto.noHistory}</h3>
                <Button asChild className="mt-4 bg-[#f4f4f5] hover:bg-zinc-200 text-zinc-950 font-semibold">
                    <Link href="/dashboard/create/solve-photo">Soru Çözmeye Başla</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {solutions.map((solution) => {
                const hasValidImage =
                    typeof solution.imageUrl === "string" &&
                    (solution.imageUrl.startsWith("http") || solution.imageUrl.startsWith("data:image/"));

                return (
                    <Card key={solution.id} className="overflow-hidden bg-[#121215] border-white/[0.08] hover:border-sky-500/40 transition-colors flex flex-col justify-between">
                        <div className="aspect-video relative bg-[#18181b] flex items-center justify-center overflow-hidden">
                            {hasValidImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={solution.imageUrl} alt="Soru" className="w-full h-full object-cover" />
                            ) : (
                                <FileText className="h-8 w-8 text-zinc-600" />
                            )}
                        </div>
                        <CardHeader className="p-4 flex-1">
                            <CardTitle className="text-sm text-zinc-100 line-clamp-2 leading-snug">{solution.questionText}</CardTitle>
                            <CardDescription className="text-xs text-zinc-400 mt-1.5 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(solution.createdAt).toLocaleDateString("tr-TR")}
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="p-4 pt-0 flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1 text-xs border-zinc-800 bg-[#18181b] hover:bg-zinc-800" asChild>
                                <Link href={`/dashboard/create/solve-photo?id=${solution.id}`}>İncele</Link>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
                                onClick={() => handleDelete(solution.id)}
                                disabled={deletingId === solution.id}
                                aria-label="Sil"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}
