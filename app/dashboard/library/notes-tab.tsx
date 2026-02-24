
"use client";

import { FileText, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface NotesTabProps {
    notes: any[] | undefined;
    isLoading: boolean;
    viewMode: 'grid' | 'list';
    dictionary: any;
}

export function NotesTab({
    notes,
    isLoading,
    viewMode,
    dictionary
}: NotesTabProps) {
    if (isLoading) {
        return (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className={viewMode === 'grid' ? "h-[300px] w-full" : "h-[80px] w-full"} />
                ))}
            </div>
        );
    }

    if (!notes || notes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-lg p-8 text-center">
                <FileText className="h-10 w-10 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-semibold">{dictionary.library.notes.noNotes}</h3>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {notes.map((note) => (
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
        </div>
    );
}
