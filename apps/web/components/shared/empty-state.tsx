"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface EmptyStateProps {
    icon: LucideIcon;
    iconColor?: string;
    iconBg?: string;
    title: string;
    description: string;
    primaryAction?: { label: string; href: string };
    secondaryAction?: { label: string; href: string };
    /** Extra content below actions (e.g. tips) */
    children?: ReactNode;
}

/**
 * Premium empty state component — animated, with gradient glow.
 * Used across Library tabs and Discover page.
 */
export function EmptyState({
    icon: Icon,
    iconColor = "text-blue-400",
    iconBg = "bg-blue-500/10",
    title,
    description,
    primaryAction,
    secondaryAction,
    children,
}: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative flex flex-col items-center justify-center min-h-[420px] p-8 text-center"
        >
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-600/5 rounded-full blur-3xl" />
            </div>

            {/* Border container */}
            <div className="relative w-full max-w-md mx-auto border border-white/[0.06] rounded-3xl p-10 bg-[#080e1c]/60 backdrop-blur-sm">
                {/* Icon */}
                <div className={`w-20 h-20 rounded-2xl ${iconBg} border border-white/[0.07] flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                    <Icon className={`w-9 h-9 ${iconColor}`} strokeWidth={1.5} />
                </div>

                {/* Text */}
                <h3 className="text-xl font-black text-white mb-2 tracking-tight">
                    {title}
                </h3>
                <p className="text-white/45 leading-relaxed text-sm mb-8 max-w-xs mx-auto">
                    {description}
                </p>

                {/* Actions */}
                {(primaryAction || secondaryAction) && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        {primaryAction && (
                            <Button
                                asChild
                                className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-blue-900/30 rounded-xl px-6"
                            >
                                <Link href={primaryAction.href}>{primaryAction.label}</Link>
                            </Button>
                        )}
                        {secondaryAction && (
                            <Button
                                asChild
                                variant="outline"
                                className="border-white/10 text-white/60 hover:text-white hover:border-white/20 rounded-xl px-6"
                            >
                                <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
                            </Button>
                        )}
                    </div>
                )}

                {children && (
                    <div className="mt-8 pt-6 border-t border-white/[0.06]">
                        {children}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
