"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ChartContainer } from "./chart-container";

interface DailyActivityProps {
    data: { date: string; duration: number }[];
}

// Tooltip içeriği özelleştirilmiş
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    const date = new Date(label);
    const formatted = `${date.getDate()} ${date.toLocaleString('tr-TR', { month: 'short' })}`;
    return (
        <div className="rounded-xl border border-white/10 bg-slate-900/95 px-3 py-2 shadow-xl backdrop-blur-md text-sm">
            <p className="text-slate-400 text-xs mb-1">{formatted}</p>
            <p className="font-bold text-cyan-400">{payload[0].value} dk</p>
        </div>
    );
}

export function DailyActivityChart({ data }: DailyActivityProps) {
    // Veri yoksa placeholder göster
    const isEmpty = !data || data.length === 0;

    return (
        <ChartContainer title="Günlük Çalışma" description="Son 30 günde harcanan süre (dakika)">
            {isEmpty ? (
                <div className="h-[220px] w-full flex flex-col items-center justify-center gap-2">
                    <div className="text-3xl">📊</div>
                    <p className="text-sm text-slate-500">Henüz çalışma verisi yok.</p>
                    <p className="text-xs text-slate-600">Çalışmaya başladığında burada görünecek.</p>
                </div>
            ) : (
                <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} barSize={14} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#00D2FF" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.5} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                            <XAxis
                                dataKey="date"
                                stroke="transparent"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: "#64748b" }}
                                tickFormatter={(value: string) => {
                                    const d = new Date(value);
                                    return `${d.getDate()}/${d.getMonth() + 1}`;
                                }}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                stroke="transparent"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: "#64748b" }}
                                tickFormatter={(value: number) => `${value}dk`}
                            />
                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ fill: "rgba(255,255,255,0.04)", radius: 4 }}
                            />
                            <Bar
                                dataKey="duration"
                                fill="url(#barGradient)"
                                radius={[6, 6, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </ChartContainer>
    );
}
