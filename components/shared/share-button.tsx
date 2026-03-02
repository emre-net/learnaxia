"use client";

import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ShareButtonProps {
    type: "module" | "collection" | "note";
    id: string;
    title: string;
}

export function ShareButton({ type, id, title }: ShareButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    // Dynamic link generator based on content type
    const getShareLink = () => {
        if (typeof window === "undefined") return "";
        const baseUrl = window.location.origin;

        switch (type) {
            case "module":
                return `${baseUrl}/dashboard/modules/${id}`;
            case "collection":
                return `${baseUrl}/dashboard/collections/${id}`;
            case "note":
                // If there's no note dedicated page, we might just share a general notes link or the specific study session. 
                // For now, let's assume notes could just point to the dashboard for now, or maybe a future /note/[id]
                return `${baseUrl}/dashboard/notes?id=${id}`;
            default:
                return baseUrl;
        }
    };

    const link = getShareLink();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(link);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy link:", err);
        }
    };

    // Prevent card click when interacting with the share button
    return (
        <div onClick={(e) => e.stopPropagation()}>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-white/50 dark:bg-zinc-800/50 hover:bg-white dark:hover:bg-zinc-700 backdrop-blur border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm transition-all duration-300 group/share"
                        title="Paylaş"
                    >
                        <Share2 className="h-4 w-4 text-zinc-600 dark:text-zinc-400 group-hover/share:text-primary transition-colors" />
                    </Button>
                </DialogTrigger>
                <DialogContent
                    className="sm:max-w-md rounded-[2rem] border-white/10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl"
                >
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">İçeriği Paylaş</DialogTitle>
                        <DialogDescription>
                            <strong>{title}</strong> adlı içeriğin bağlantısını kopyalayıp arkadaşlarınızla veya takımınızla paylaşabilirsiniz.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 mt-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="link" className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                Paylaşım Bağlantısı
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="link"
                                    value={link}
                                    readOnly
                                    className="flex-1 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-xl font-mono text-xs focus-visible:ring-primary/20"
                                />
                                <Button
                                    type="button"
                                    size="icon"
                                    onClick={handleCopy}
                                    className={`rounded-xl transition-all duration-300 w-10 h-10 ${isCopied ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-primary hover:bg-primary/90'}`}
                                >
                                    {isCopied ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
