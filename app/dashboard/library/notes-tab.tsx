
"use client";

import { FileText, BookOpen, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";

interface NotesTabProps {
    viewMode: 'grid' | 'list';
    dictionary: any;
}

export function NotesTab({
    viewMode,
    dictionary
}: NotesTabProps) {
    const { ref, inView } = useInView();

    const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useInfiniteQuery({
        queryKey: ['library-notes'],
        queryFn: async ({ pageParam = 0 }) => {
            const params = new URLSearchParams({
                limit: '12',
                offset: pageParam.toString(),
            });
            const res = await fetch(`/api/notes?${params}`);
            if (!res.ok) throw new Error('Failed to fetch notes');
            return res.json();
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            const currentTotalItems = allPages.reduce((acc, page) => acc + page.items.length, 0);
            return currentTotalItems < lastPage.total ? currentTotalItems : undefined;
        }
    });

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

    const items = data ? data.pages.flatMap(page => page.items) : [];
    if (isLoading) {
        return (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className={viewMode === 'grid' ? "h-[300px] w-full" : "h-[80px] w-full"} />
                ))}
            </div>
        );
    }

    if (!isLoading && items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-lg p-8 text-center">
                <FileText className="h-10 w-10 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-semibold">{dictionary.library.notes.noNotes}</h3>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {items.map((note) => (
                <Card key={note.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-[10px]">
                                {note.moduleId ? dictionary.library.notes.moduleNote : dictionary.library.notes.aiSolution}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                                {new Date(note.updatedAt).toLocaleDateString()}
                            </span>
                        </div>
                        <CardTitle className="text-sm mt-2">{note.title || "Adsız Not"}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <p className="text-sm text-muted-foreground line-clamp-3">{note.content}</p>
                        <div className="mt-3 text-[10px] font-medium text-primary flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {note.module?.title || note.solvedQuestion?.questionText.substring(0, 30) + "..."}
                        </div>
                    </CardContent>
                </Card>
            ))}

            {hasNextPage && (
                <div ref={ref} className="flex justify-center py-8">
                    {isFetchingNextPage ? (
                        <div className="flex items-center gap-2 text-muted-foreground font-medium animate-pulse">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Daha fazla yükleniyor...
                        </div>
                    ) : (
                        <div className="h-8"></div>
                    )}
                </div>
            )}
        </div>
    );
}
