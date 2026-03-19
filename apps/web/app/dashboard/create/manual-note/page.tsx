"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save, FileText, Sparkles } from "lucide-react"
import { BrandLoader } from "@/components/ui/brand-loader"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/i18n"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"

export default function ManualNotePage() {
    const { t } = useTranslation();
    const router = useRouter();
    const { toast } = useToast();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!content.trim()) {
            toast({
                title: t("common.error"),
                description: t("creation.manualNote.errorEmpty") || "Not içeriği boş olamaz.",
                variant: "destructive"
            });
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch("/api/notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim() || t("creation.manualNote.untitled") || "İsimsiz Not",
                    content: content
                })
            });

            if (!res.ok) {
                throw new Error("Failed to save note");
            }

            toast({
                title: t("common.success"),
                description: t("creation.manualNote.successMessage") || "Notunuz başarıyla kaydedildi.",
            });

            router.push("/dashboard/library?tab=notes"); // Redirect to notes library
        } catch (error) {
            console.error("Save error:", error);
            toast({
                title: t("common.error"),
                description: t("creation.manualNote.saveFailed") || "Not kaydedilirken bir hata oluştu.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 max-w-5xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-between"
            >
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 bg-muted/50 hover:bg-muted" asChild>
                        <Link href="/dashboard/create">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
                                {t("creation.manualNote.title") || "Yeni Serbest Not"}
                            </h1>
                            <Sparkles className="h-5 w-5 text-indigo-500" />
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm md:text-base">
                            {t("creation.manualNote.description") || "Fikirlerinizi, özetlerinizi veya çalışma notlarınızı kaleme alın."}
                        </p>
                    </div>
                </div>

                <div className="hidden md:block">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || content.length === 0}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 px-6 rounded-xl transition-all hover:scale-105 active:scale-95 h-11"
                    >
                        {isSaving ? <BrandLoader size="sm" className="mr-2" showBlur={false} /> : <Save className="mr-2 h-4 w-4" />}
                        {t("creation.manualNote.saveNote") || "Notu Kaydet"}
                    </Button>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
            >
                <Card className="border-border/50 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl shadow-2xl overflow-hidden rounded-3xl group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-50" />
                    <CardHeader className="bg-muted/10 border-b border-border/50 pb-6">
                        <Input
                            className="text-2xl md:text-3xl font-bold bg-transparent border-none outline-none shadow-none focus-visible:ring-0 px-0 placeholder:text-muted-foreground/50 h-auto"
                            placeholder={t("creation.manualNote.titlePlaceholder") || "Not başlığı..."}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={100}
                        />
                    </CardHeader>
                    <CardContent className="p-0">
                        <textarea
                            className="w-full min-h-[500px] bg-transparent border-none p-6 text-foreground text-base md:text-lg focus:outline-none resize-y placeholder:text-muted-foreground/40 leading-relaxed font-medium"
                            placeholder={t("creation.manualNote.placeholder") || "Düşüncelerinizi buraya yazmaya başlayın..."}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </CardContent>

                    <div className="px-6 py-4 bg-muted/10 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground font-medium">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5"><FileText className="h-3 w-3" /> {content.length} karakter</span>
                            <span>{content.split(/\s+/).filter(word => word.length > 0).length} kelime</span>
                        </div>
                        <div className="md:hidden">
                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving || content.length === 0}
                                    size="sm"
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg h-8"
                                >
                                    {isSaving ? <BrandLoader size="sm" className="mr-2" showBlur={false} /> : <Save className="mr-2 h-3 w-3" />}
                                    Kaydet
                                </Button>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </div>
    )
}
