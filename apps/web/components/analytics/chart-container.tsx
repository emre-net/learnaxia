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
        <Card className={cn("overflow-hidden glass border-white/[0.08]", className)}>
            <CardHeader className="px-5 py-4 border-b border-white/[0.06]">
                <CardTitle className="text-sm font-semibold text-slate-200">{title}</CardTitle>
                {description && <CardDescription className="text-xs text-slate-500 mt-0.5">{description}</CardDescription>}
            </CardHeader>
            <CardContent className="p-5">
                {children}
            </CardContent>
        </Card>
    );
}
