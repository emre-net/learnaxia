
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedBadge } from "./verified-badge";

interface CardOwnerProps {
    handle: string | null;
    image?: string | null;
    isVerified?: boolean;
    isTeam?: boolean;
}

export function CardOwner({ handle, image, isVerified, isTeam }: CardOwnerProps) {
    const displayName = isTeam || handle === 'learnaxia' ? 'Learnaxia Ekibi' : `@${handle || 'user'}`;
    const fallback = (handle?.[0] || 'U').toUpperCase();

    return (
        <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8 rounded-lg border border-muted-foreground/10 shadow-inner grayscale-[0.5] group-hover:grayscale-0 transition-all">
                <AvatarImage src={image || ""} />
                <AvatarFallback className="text-xs uppercase font-bold text-muted-foreground bg-muted">{fallback}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[13px] font-bold text-muted-foreground transition-colors group-hover:text-foreground">
                    {displayName}
                </span>
                {isVerified && <VerifiedBadge isTeam={isTeam || handle === 'learnaxia'} />}
            </div>
        </div>
    );
}
