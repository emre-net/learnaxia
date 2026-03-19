"use client";

import { ChartContainer } from "./chart-container";
import { Progress } from "@/components/ui/progress";

interface ModuleStats {
    title: string;
    accuracy: number;
    totalInteractions: number;
}

interface ModulePerformanceProps {
    data: ModuleStats[];
}

export function ModulePerformanceList({ data }: ModulePerformanceProps) {
    return (
        <ChartContainer title="Top Active Modules" description="Most interactions in your modules.">
            <div className="space-y-4">
                {data.map((mod, i) => (
                    <div key={i} className="space-y-1.5 flex flex-col p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <div className="text-sm font-medium">{mod.title}</div>
                        <p className="text-xs text-muted-foreground text-right">{mod.totalInteractions} interactions</p>
                    </div>
                ))}
                {data.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No data yet.</p>}
            </div>
        </ChartContainer>
    );
}
