
"use client";

import { Brain, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

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
            <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-lg p-8 text-center">
                <Brain className="h-10 w-10 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-semibold">{dictionary.solvePhoto.noHistory}</h3>
                <Button asChild className="mt-4">
                    <Link href="/dashboard/create/solve-photo">Soru Çözmeye Başla</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {solutions.map((solution) => (
                <Card key={solution.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-video relative bg-muted">
                        {solution.imageUrl ? (
                            <Image src={solution.imageUrl} alt="Soru" fill className="object-cover" />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    <CardHeader className="p-4">
                        <CardTitle className="text-sm line-clamp-2 leading-snug">{solution.questionText}</CardTitle>
                        <CardDescription className="text-[10px] mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(solution.createdAt).toLocaleDateString()}
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="p-4 pt-0">
                        <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                            <Link href={`/dashboard/create/solve-photo?id=${solution.id}`}>İncele</Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
