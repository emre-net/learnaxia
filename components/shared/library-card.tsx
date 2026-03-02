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
    description: string | React.ReactNode;
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
                className="flex flex-row items-center gap-5 p-4 md:p-5 hover:shadow-2xl hover:shadow-zinc-200/30 dark:hover:shadow-black/50 transition-all duration-500 group border-white/60 dark:border-white/5 bg-white/40 backdrop-blur-2xl dark:bg-zinc-950/40 rounded-[2rem] cursor-pointer shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]"
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
                    <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 line-clamp-1 leading-relaxed">
                        {description || "Açıklama yok"}
                    </div>
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
            className="flex flex-col hover:shadow-2xl hover:shadow-zinc-300/40 dark:hover:shadow-black/60 hover:-translate-y-1.5 transition-all duration-500 ease-out group h-full border-white/60 dark:border-white/5 bg-white/50 backdrop-blur-2xl dark:bg-zinc-950/50 overflow-hidden rounded-[2rem] cursor-pointer shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] relative"
            onClick={onClick}
        >
            {/* Subtle gradient overlay for extra premium feel */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="p-6 md:p-8 flex-grow space-y-6 relative z-10">
                <div className="flex justify-between items-start gap-4">
                    <div className="group-hover:scale-110 transition-transform duration-500 drop-shadow-sm">
                        {typeIcon}
                    </div>
                    <div className="flex items-center gap-2 pt-1" onClick={(e) => onClick ? undefined : e.stopPropagation()}>
                        {visibility && <VisibilityBadge visibility={visibility as any} className="h-7 text-xs px-3 shadow-sm bg-white/80 dark:bg-zinc-900/80 backdrop-blur border-white/50 dark:border-zinc-800" />}
                        {saveButton}
                    </div>
                </div>

                <div className="space-y-3.5 pt-2">
                    <CardTitle className="leading-tight text-2xl font-black tracking-tight text-zinc-900 dark:text-white group-hover:text-primary transition-colors duration-300">
                        {title}
                    </CardTitle>
                    <div className="text-[15px] font-medium text-zinc-500 dark:text-zinc-400 line-clamp-2 min-h-[44px] leading-relaxed">
                        {description || "Bu içerik için henüz bir açıklama girilmemiş."}
                    </div>
                </div>

                {metrics.length > 0 && (
                    <div className="flex items-center gap-6 py-4 border-y border-zinc-200/40 dark:border-zinc-800/40 flex-wrap">
                        {metrics.map((metric, i) => (
                            <div key={i} className="flex items-center gap-2.5" title={metric.label}>
                                <div className={`flex items-center justify-center p-2 rounded-xl transition-colors duration-300 ${metric.isActive ? 'text-primary bg-primary/10 dark:bg-primary/20 shadow-sm' : 'text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-800/50 shadow-sm border border-zinc-100 dark:border-zinc-800'}`}>
                                    {metric.icon}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[15px] font-extrabold text-zinc-800 dark:text-zinc-200 leading-tight mb-0.5">{metric.count}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 leading-none">
                                        {metric.label}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {metadata.length > 0 && (
                    <div className="flex flex-col gap-2 pt-1">
                        {metadata.map((meta, i) => (
                            <div key={i} className="flex items-center gap-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400" title="Bilgi">
                                <div className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                {meta}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {(owner || actionButton) && (
                <div className="p-5 md:p-6 mb-1 mx-2 flex flex-col xs:flex-row items-center justify-between gap-4 mt-auto rounded-[1.5rem] bg-zinc-50/50 dark:bg-zinc-900/30 backdrop-blur-md relative z-10 border border-transparent dark:border-white/5" onClick={(e) => onClick ? undefined : e.stopPropagation()}>
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
                        <div className="w-full xs:w-auto transition-transform hover:scale-105 active:scale-95 duration-200">
                            {actionButton}
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}
