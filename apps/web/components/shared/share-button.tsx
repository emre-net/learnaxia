"use client";

import { useState } from "react";
import { Share2, Copy, Check, MessageCircle, Twitter, Linkedin, Mail } from "lucide-react";
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
import { useToast } from "@/components/ui/use-toast";

interface ShareButtonProps {
    type: "module" | "collection" | "note" | "profile";
    id: string; // id or handle
    title: string;
}

export function ShareButton({ type, id, title }: ShareButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const { toast } = useToast();

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
                return `${baseUrl}/dashboard/notes?id=${id}`;
            case "profile":
                return `${baseUrl}/u/${id}`;
            default:
                return baseUrl;
        }
    };

    const link = getShareLink();
    const shareText = `Learnaxia'da şu harika içeriğe göz atmalısın: ${title}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(link);
            setIsCopied(true);
            toast({
                title: "Bağlantı kopyalandı",
                description: "Panoya kopyalandı, istediğiniz yere yapıştırabilirsiniz.",
            });
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy link:", err);
            toast({
                title: "Hata",
                description: "Bağlantı kopyalanamadı.",
                variant: "destructive"
            });
        }
    };

    const shareOptions = [
        {
            name: "WhatsApp",
            icon: MessageCircle,
            color: "bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white border-[#25D366]/20",
            href: `https://wa.me/?text=${encodeURIComponent(shareText + " " + link)}`,
        },
        {
            name: "X (Twitter)",
            icon: Twitter,
            color: "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-900 hover:text-white dark:hover:bg-zinc-100 dark:hover:text-zinc-900 border-zinc-200 dark:border-zinc-700",
            href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(link)}`,
        },
        {
            name: "LinkedIn",
            icon: Linkedin,
            color: "bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white border-[#0A66C2]/20",
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
        },
        {
            name: "E-Posta",
            icon: Mail,
            color: "bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white border-blue-500/20",
            href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareText + "\n\n" + link)}`,
        }
    ];

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
                    className="sm:max-w-[425px] rounded-[2rem] border-white/10 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl shadow-2xl overflow-hidden p-0"
                >
                    <div className="p-6 pb-2">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
                                <Share2 className="h-5 w-5 text-indigo-500" />
                                Paylaş
                            </DialogTitle>
                            <DialogDescription className="text-sm font-medium mt-1">
                                <span className="text-foreground font-semibold">{title}</span> adlı içeriği arkadaşlarınızla hızlıca paylaşın.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-6 pt-4 space-y-6">
                        <div className="grid grid-cols-4 gap-3">
                            {shareOptions.map((opt) => (
                                <a
                                    key={opt.name}
                                    href={opt.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col items-center gap-2 group outline-none"
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 shadow-sm ${opt.color} group-hover:scale-105 group-active:scale-95`}>
                                        <opt.icon className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors text-center">
                                        {opt.name}
                                    </span>
                                </a>
                            ))}
                        </div>

                        <div className="space-y-3 bg-muted/30 p-4 rounded-2xl border border-muted-foreground/10">
                            <Label htmlFor="link" className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                                VEYA BAĞLANTIYI KOPYALA
                            </Label>
                            <div
                                className="flex items-center gap-2 bg-background border border-border rounded-xl p-1.5 cursor-pointer hover:border-primary/50 transition-colors group"
                                onClick={handleCopy}
                            >
                                <Input
                                    id="link"
                                    value={link}
                                    readOnly
                                    className="flex-1 bg-transparent border-none font-mono text-xs focus-visible:ring-0 shadow-none pointer-events-none text-muted-foreground"
                                />
                                <Button
                                    type="button"
                                    size="sm"
                                    className={`rounded-lg transition-all duration-300 px-4 font-bold shadow-md ${isCopied ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/20' : 'bg-primary hover:bg-primary/90 shadow-primary/20'}`}
                                >
                                    {isCopied ? (
                                        <><Check className="h-4 w-4 mr-1.5" /> Kopyalandı</>
                                    ) : (
                                        <><Copy className="h-4 w-4 mr-1.5" /> Kopyala</>
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
