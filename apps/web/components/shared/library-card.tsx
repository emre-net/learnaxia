"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { VisibilityBadge } from "@/components/shared/visibility-badge";
import { CardOwner } from "@/components/shared/card-owner";
import { ShareButton } from "@/components/shared/share-button";

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
    shareType?: "module" | "collection" | "note";
    shareId?: string;
    shareTitle?: string;
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
    shareType,
    shareId,
    shareTitle,
    onClick
}: LibraryCardProps) {
    if (viewMode === 'list') {
        return (
            <Card
                className="flex flex-row items-center gap-5 p-4 md:p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl cursor-pointer shadow-sm relative overflow-hidden"
                onClick={onClick}
            >
                {/* Glow effect on hover */}
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
                    {typeIcon}
                </div>
                <div className="flex-1 min-w-0 pr-2">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5 pt-0.5">
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
                    {shareType && shareId && shareTitle && (
                        <ShareButton type={shareType} id={shareId} title={shareTitle} />
                    )}
                    {saveButton}
                    {actionButton}
                </div>
            </Card>
        );
    }

    return (
        <Card
            className="flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out group h-full border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden rounded-2xl cursor-pointer shadow-sm relative"
            onClick={onClick}
        >
            {/* Top glow indicator */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/40 to-indigo-500/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Subtle background gradient on hover for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent dark:from-white/[0.02] dark:to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="p-6 md:p-7 flex-grow space-y-6 relative z-10">
                <div className="flex justify-between items-start gap-4">
                    <div className="group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                        {typeIcon}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 pt-0.5" onClick={(e) => onClick ? undefined : e.stopPropagation()}>
                        {visibility && <VisibilityBadge visibility={visibility as any} className="h-6 text-[11px] px-2.5 shadow-none border-zinc-200 dark:border-zinc-800" />}
                        {shareType && shareId && shareTitle && (
                            <ShareButton type={shareType} id={shareId} title={shareTitle} />
                        )}
                        {saveButton}
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                    <CardTitle className="leading-tight text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 group-hover:text-primary transition-colors duration-200">
                        {title}
                    </CardTitle>
                    <div className="text-[14px] font-medium text-zinc-500 dark:text-zinc-400 line-clamp-2 min-h-[40px] leading-relaxed">
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
                <div className="px-6 pb-6 pt-4 mt-auto border-t border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/20 relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" onClick={(e) => onClick ? undefined : e.stopPropagation()}>
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
