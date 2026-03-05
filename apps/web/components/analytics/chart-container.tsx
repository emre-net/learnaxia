"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChartContainerProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

export function ChartContainer({ title, description, children, className }: ChartContainerProps) {
    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardHeader className="p-4 border-b bg-muted/40">
                <CardTitle className="text-base font-semibold">{title}</CardTitle>
                {description && <CardDescription className="text-xs">{description}</CardDescription>}
            </CardHeader>
            <CardContent className="p-4">
                {children}
            </CardContent>
        </Card>
    );
}
