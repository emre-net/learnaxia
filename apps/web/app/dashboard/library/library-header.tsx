
"use client";

interface LibraryHeaderProps {
    title: string;
    description: string;
}

export function LibraryHeader({ title, description }: LibraryHeaderProps) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                <p className="text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}
