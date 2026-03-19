"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { ChartContainer } from "./chart-container";

interface DailyActivityProps {
    data: { date: string; duration: number }[];
}

export function DailyActivityChart({ data }: DailyActivityProps) {
    return (
        <ChartContainer title="Daily Study Activity" description="Minutes spent learning per day.">
            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis
                            dataKey="date"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value: string) => {
                                const d = new Date(value);
                                return `${d.getDate()}/${d.getMonth() + 1}`;
                            }}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value: number) => `${value}m`}
                        />
                        <Tooltip
                            contentStyle={{ background: "#1f2937", border: "none", borderRadius: "8px", color: "#fff" }}
                            cursor={{ fill: "rgba(255,255,255,0.1)" }}
                        />
                        <Bar
                            dataKey="duration"
                            fill="currentColor"
                            className="fill-primary"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </ChartContainer>
    );
}
