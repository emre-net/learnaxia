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
        <ChartContainer title="Top Module Performance" description="Accuracy in your most active modules.">
            <div className="space-y-4">
                {data.map((mod, i) => (
                    <div key={i} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium truncate max-w-[70%]">{mod.title}</span>
                            <span className="text-muted-foreground">{mod.accuracy}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Progress value={mod.accuracy} className={mod.accuracy > 80 ? "bg-green-100" : ""} />
                        </div>
                        <p className="text-xs text-muted-foreground text-right">{mod.totalInteractions} interactions</p>
                    </div>
                ))}
                {data.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No data yet.</p>}
            </div>
        </ChartContainer>
    );
}
