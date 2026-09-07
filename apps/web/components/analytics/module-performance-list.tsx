"use client";

import { ChartContainer } from "./chart-container";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ModuleStats {
    title: string;
    accuracy: number;
    totalInteractions: number;
}

interface ModulePerformanceProps {
    data: ModuleStats[];
}

export function ModulePerformanceList({ data }: ModulePerformanceProps) {
    const isEmpty = !data || data.length === 0;

    return (
        <ChartContainer title="Modül Performansı" description="En çok etkileşim kurduğun modüller">
            {isEmpty ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10">
                    <div className="text-3xl">📚</div>
                    <p className="text-sm text-slate-500">Henüz veri yok.</p>
                    <p className="text-xs text-slate-600">Modüllerle çalışmaya başla!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {data.slice(0, 6).map((mod, i) => {
                        const acc = mod.accuracy ?? 0;
                        const color = acc >= 80 ? "text-emerald-400" : acc >= 50 ? "text-amber-400" : "text-red-400";
                        const barColor = acc >= 80 ? "bg-emerald-500" : acc >= 50 ? "bg-amber-500" : "bg-red-500";
                        const Icon = acc >= 70 ? TrendingUp : acc >= 40 ? Minus : TrendingDown;

                        return (
                            <div key={i} className="group flex flex-col gap-1.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors duration-200">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-medium text-slate-200 truncate flex-1">{mod.title}</span>
                                    <div className={`flex items-center gap-1 text-xs font-bold ${color} shrink-0`}>
                                        <Icon className="w-3 h-3" />
                                        {acc}%
                                    </div>
                                </div>
                                {/* Accuracy progress bar */}
                                <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                        style={{ width: `${acc}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500">{mod.totalInteractions} etkileşim</p>
                            </div>
                        );
                    })}
                </div>
            )}
        </ChartContainer>
    );
}
