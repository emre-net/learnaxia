
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Layers, MoreVertical, BookCopy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LocalCollection {
    id: string;
    title: string;
    description: string | null;
    isPublic: boolean;
    ownerId: string;
    moduleIds: string[];
    createdAt: string;
    updatedAt: string;
    owner: {
        handle: string | null;
    };
    _count?: {
        modules: number
    }
}

interface CollectionCardProps {
    item: {
        collection: LocalCollection;
        role: string;
        lastInteractionAt: string;
    };
    viewMode: 'grid' | 'list';
}

export function CollectionCard({ item, viewMode }: CollectionCardProps) {
    const { collection, role } = item;

    // Approximate module count from moduleIds length if _count not available
    const moduleCount = collection.moduleIds.length;

    if (viewMode === 'list') {
        return (
            <Card className="flex flex-row items-center gap-4 p-4 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <Layers className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Link href={`/collections/${collection.id}`} className="font-semibold text-lg hover:underline truncate">
                            {collection.title}
                        </Link>
                        {!collection.isPublic && <Badge variant="secondary" className="text-[10px] h-5">Private</Badge>}
                        {role === 'OWNER' && <Badge variant="outline" className="text-[10px] h-5">Owner</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                        {collection.description || "No description"}
                    </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground hidden sm:flex">
                    <div className="flex items-center gap-1">
                        <BookCopy className="h-4 w-4" />
                        <span>{moduleCount} Modules</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarFallback>{collection.owner.handle?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                        <span className="max-w-[100px] truncate">{collection.owner.handle || "user"}</span>
                    </div>
                </div>
                <Link href={`/collections/${collection.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                </Link>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col hover:shadow-lg transition-all duration-200 group h-full">
            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start gap-2">
                    <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0 mb-2">
                        <Layers className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex gap-1">
                        {!collection.isPublic && <Badge variant="secondary" className="text-[10px] h-5 px-1">Private</Badge>}
                        {role === 'OWNER' && <Badge variant="outline" className="text-[10px] h-5 px-1 bg-background">Owner</Badge>}
                    </div>
                </div>
                <CardTitle className="leading-tight">
                    <Link href={`/collections/${collection.id}`} className="hover:underline line-clamp-2">
                        {collection.title}
                    </Link>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">
                    {collection.description || "No description provided."}
                </p>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex items-center justify-between text-xs text-muted-foreground mt-auto">
                <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[10px]">{collection.owner.handle?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <span className="truncate max-w-[80px]">{collection.owner.handle || "user"}</span>
                </div>
                <div className="flex items-center gap-1">
                    <BookCopy className="h-3 w-3" />
                    <span>{moduleCount}</span>
                </div>
            </CardFooter>
        </Card>
    );
}
