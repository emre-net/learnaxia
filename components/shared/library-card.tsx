"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { VisibilityBadge } from "@/components/shared/visibility-badge";
import { CardOwner } from "@/components/shared/card-owner";

export interface LibraryCardMetric {
    icon: React.ReactNode;
    count: number | string;
    label: string;
    isActive?: boolean;
}

export interface LibraryCardProps {
    viewMode?: 'grid' | 'list';
    typeIcon: React.ReactNode;
    visibility?: 'PUBLIC' | 'PRIVATE' | 'DRAFT' | 'LINK' | string;
    title: string;
    description: string;
    metrics?: LibraryCardMetric[];
    metadata?: React.ReactNode[];
    owner?: { handle: string | null; image?: string | null; isVerified?: boolean; isTeam?: boolean } | null;
    actionButton?: React.ReactNode;
    saveButton?: React.ReactNode;
    onClick?: () => void;
}

export function LibraryCard({
    viewMode = 'grid',
    typeIcon,
    visibility,
    title,
    description,
    metrics = [],
    metadata = [],
    owner,
    actionButton,
    saveButton,
    onClick
}: LibraryCardProps) {
    if (viewMode === 'list') {
        return (
            <Card
                className="flex flex-row items-center gap-5 p-4 md:p-5 hover:shadow-2xl hover:shadow-zinc-300/30 dark:hover:shadow-black/50 transition-all duration-500 group border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 backdrop-blur-md dark:bg-zinc-900/60 rounded-3xl cursor-pointer"
                onClick={onClick}
            >
                <div className="group-hover:scale-105 transition-transform duration-500 flex-shrink-0">
                    {typeIcon}
                </div>
                <div className="flex-1 min-w-0 pr-2">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="font-extrabold text-lg tracking-tight text-zinc-900 dark:text-zinc-50 group-hover:text-primary transition-colors truncate">
                            {title}
                        </span>
                        {visibility && <VisibilityBadge visibility={visibility as any} className="h-5" />}
                    </div>
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 line-clamp-1 leading-relaxed">
                        {description || "Açıklama yok"}
                    </p>
                </div>
                <div className="flex items-center gap-3 pl-2" onClick={(e) => onClick ? undefined : e.stopPropagation()}>
                    {saveButton}
                    {actionButton}
                </div>
            </Card>
        );
    }

    return (
        <Card
            className="flex flex-col hover:shadow-2xl hover:shadow-zinc-300/40 dark:hover:shadow-black/60 hover:-translate-y-1 transition-all duration-500 ease-out group h-full border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 backdrop-blur-xl dark:bg-zinc-900/60 overflow-hidden rounded-[2rem] cursor-pointer"
            onClick={onClick}
        >
            <div className="p-6 md:p-8 flex-grow space-y-6">
                <div className="flex justify-between items-start gap-4">
                    <div className="group-hover:scale-110 transition-transform duration-500 drop-shadow-sm">
                        {typeIcon}
                    </div>
                    <div className="flex items-center gap-2 pt-1" onClick={(e) => onClick ? undefined : e.stopPropagation()}>
                        {visibility && <VisibilityBadge visibility={visibility as any} className="h-7 text-xs px-3 shadow-sm" />}
                        {saveButton}
                    </div>
                </div>

                <div className="space-y-3.5 pt-2">
                    <CardTitle className="leading-tight text-2xl font-black tracking-tight text-zinc-900 dark:text-white group-hover:text-primary transition-colors duration-300">
                        {title}
                    </CardTitle>
                    <p className="text-[15px] font-medium text-zinc-500 dark:text-zinc-400 line-clamp-2 min-h-[44px] leading-relaxed">
                        {description || "Bu içerik için henüz bir açıklama girilmemiş."}
                    </p>
                </div>

                {metrics.length > 0 && (
                    <div className="flex items-center gap-7 py-5 border-y border-zinc-200/50 dark:border-zinc-800/50 flex-wrap">
                        {metrics.map((metric, i) => (
                            <div key={i} className="flex items-center gap-3" title={metric.label}>
                                <div className={`p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 ${metric.isActive ? 'text-primary bg-primary/10 dark:bg-primary/20' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                    {metric.icon}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-base font-black text-zinc-800 dark:text-zinc-200 leading-none mb-1">{metric.count}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 leading-none">
                                        {metric.label}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {metadata.length > 0 && (
                    <div className="flex flex-col gap-2.5 pt-1">
                        {metadata.map((meta, i) => (
                            <div key={i} className="flex items-center gap-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-800/30 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                {meta}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {(owner || actionButton) && (
                <div className="p-5 md:p-6 pt-5 mt-auto flex flex-col xs:flex-row items-center justify-between gap-4 border-t border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-md" onClick={(e) => onClick ? undefined : e.stopPropagation()}>
                    {owner ? (
                        <CardOwner
                            handle={owner.handle}
                            image={owner.image}
                            isVerified={owner.isVerified}
                            isTeam={owner.isTeam}
                        />
                    ) : (
                        <div />
                    )}

                    {actionButton && (
                        <div className="w-full xs:w-auto shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-shadow rounded-2xl">
                            {actionButton}
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}
