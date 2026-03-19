
"use client";

import { CheckCircle2 } from "lucide-react";

interface VerifiedBadgeProps {
    isTeam?: boolean;
    className?: string;
}

export function VerifiedBadge({ isTeam = false, className = "" }: VerifiedBadgeProps) {
    return (
        <div
            title={isTeam ? "Bu içerik Learnaxia ekibi tarafından doğrulanmıştır" : "Doğrulanmış İçerik"}
            className={`flex items-center ${className}`}
        >
            <CheckCircle2 className={`h-3.5 w-3.5 ${isTeam ? "text-blue-600 fill-blue-500/10" : "text-green-600 fill-green-500/10"}`} />
        </div>
    );
}
