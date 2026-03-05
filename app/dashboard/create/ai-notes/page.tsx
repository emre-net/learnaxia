"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Cpu, ArrowLeft, Upload, FileUp, Sparkles, Wand2, FileText, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n/i18n"
import { motion } from "framer-motion"

export default function AiNotePage() {
    const [isExtracting, setIsExtracting] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const { t } = useTranslation();

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsExtracting(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/file/extract", {
                method: "POST",
                body: formData
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to extract document");
            }

            const data = await res.json();

            // Redirect to AI Creation Wizard with the extracted text via session storage
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('magic_wand_text', data.text.substring(0, 19500));
            }

            toast({
                title: t("common.success") || "Başarılı",
                description: t("creation.itemsReady", { count: " " }) || "İçerik başarıyla çözümlendi. Oluşturucuya yönlendiriliyorsunuz.",
            });

            router.push('/dashboard/create/ai');

        } catch (error: any) {
            console.error("Extraction error:", error);
            toast({
                title: t("common.error"),
                description: error.message || t("solvePhoto.errors.generic"),
                variant: "destructive"
            });
        } finally {
            setIsExtracting(false);
            e.target.value = '';
        }
    };

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 max-w-6xl mx-auto min-h-screen">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-4"
            >
                <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 bg-muted/50 hover:bg-muted" asChild>
                    <Link href="/dashboard/create">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-indigo-600">
                            {t("creation.aiNotes.title") || "Zekâ ile Not Çıkar"}
                        </h1>
                        <Wand2 className="h-6 w-6 text-purple-500" />
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">
                        {t("creation.aiNotes.description") || "PDF, Word veya Metin dosyanızı yükleyin; Yapay Zeka saniyeler içinde sizin için özetlesin ve notlara dönüştürsün."}
                    </p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="lg:col-span-3"
                >
                    <Card className="relative bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-slate-800/50 flex flex-col items-center justify-center p-8 md:p-16 text-center group transition-all shadow-2xl overflow-hidden rounded-3xl min-h-[450px] backdrop-blur-xl">
                        {/* Interactive Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-transparent transition-opacity" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/20 blur-[100px] rounded-full group-hover:bg-purple-500/30 transition-all duration-700" />

                        <div className="relative z-10 flex flex-col items-center">
                            <motion.div
                                className="p-6 rounded-3xl bg-gradient-to-tr from-purple-600/10 to-indigo-600/10 text-purple-500 mb-8 border border-purple-500/20 shadow-xl shadow-purple-500/5"
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            >
                                <FileUp className="h-16 w-16" />
                            </motion.div>

                            <h2 className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                                {t("creation.aiNotes.uploadTitle") || "Belgenizi Yükleyin"}
                            </h2>
                            <p className="max-w-md text-muted-foreground text-lg mb-10 leading-relaxed">
                                {t("creation.aiNotes.uploadDesc") || "Oluşturmak istediğiniz notların kaynağı olan belgeyi seçin. PDF, DOCX ve PPTX formatları desteklenmektedir."}
                            </p>

                            <Label
                                htmlFor="ai-note-doc-upload"
                                className={`relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold px-10 py-4 rounded-2xl flex items-center justify-center cursor-pointer transition-all shadow-xl shadow-purple-500/25 hover:scale-105 active:scale-95 w-max ${isExtracting ? 'pointer-events-none opacity-80' : ''}`}
                            >
                                {isExtracting ? (
                                    <span className="flex items-center gap-3">
                                        <Cpu className="h-5 w-5 border-t border-t-white rounded-full animate-spin" />
                                        Yapay Zeka Okuyor...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-3 text-lg">
                                        <Upload className="h-5 w-5" /> Dosya Seç
                                    </span>
                                )}
                                <input
                                    id="ai-note-doc-upload"
                                    type="file"
                                    accept=".pdf,.txt,.pptx,.docx"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={isExtracting}
                                />
                                {/* Glow Effect on button */}
                                <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 hover:opacity-100 transition-opacity" />
                            </Label>
                        </div>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="lg:col-span-2"
                >
                    <Card className="bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-slate-800/50 p-8 flex flex-col h-full rounded-3xl shadow-xl backdrop-blur-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full" />

                        <div className="flex items-center gap-3 mb-8 relative z-10 border-b border-border/50 pb-6">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-500 border border-emerald-500/20">
                                <Sparkles className="h-6 w-6" />
                            </div>
                            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                                {t("creation.aiNotes.howItWorks") || "Süreç Nasıl İşler?"}
                            </h3>
                        </div>

                        <div className="space-y-8 relative z-10 flex-1">
                            {[
                                { step: "1", title: "Belgeyi Seçin", desc: "PDF veya belge dosyanızı sisteme yükleyin.", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
                                { step: "2", title: "AI Çözümler", desc: "Learnaxia AI metni okur ve anlar.", icon: Cpu, color: "text-purple-500", bg: "bg-purple-500/10" },
                                { step: "3", title: "Sihirli Düzenleme", desc: "Çıkarılan metni dilediğiniz gibi şekillendirin.", icon: Wand2, color: "text-indigo-500", bg: "bg-indigo-500/10" },
                                { step: "4", title: "Öğrenmeye Başlayın", desc: "Notlarınızı, kartlarınızı ve testlerinizi oluşturun.", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" }
                            ].map((item, index) => (
                                <div key={item.step} className="flex gap-5 group">
                                    <div className="relative">
                                        <div className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center font-bold ${item.bg} ${item.color} group-hover:scale-110 transition-transform shadow-sm`}>
                                            <item.icon className="h-5 w-5" />
                                        </div>
                                        {index !== 3 && <div className="absolute top-10 bottom-[-32px] left-1/2 w-px bg-border group-hover:bg-primary/50 transition-colors" />}
                                    </div>
                                    <div className="flex-1 pb-1">
                                        <h4 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{item.title}</h4>
                                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
