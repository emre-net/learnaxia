"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, Sparkles, BrainCircuit, UploadCloud, CheckCircle2, XCircle, Plus, Minus, Settings2, Zap, ArrowRight, Target } from "lucide-react"
import { BrandLoader } from "@/components/ui/brand-loader"

import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useTranslation } from "@/lib/i18n/i18n"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface SyllabusItem {
    order: number;
    title: string;
    overview: string;
}

export default function CreateLearningPlanPage() {
    const router = useRouter()
    const { t } = useTranslation()
    const { toast } = useToast()

    const [isLoading, setIsLoading] = useState(false)
    const [step, setStep] = useState<"input" | "generating" | "review">("input")
    const [errorMsg, setErrorMsg] = useState("")

    // Form states
    const [topic, setTopic] = useState("")
    const [goal, setGoal] = useState("")
    const [depth, setDepth] = useState<"shallow" | "standard" | "deep">("standard")

    // Generated Syllabus
    const [syllabus, setSyllabus] = useState<SyllabusItem[]>([])

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMsg("")

        if (!topic.trim()) {
            setErrorMsg("Lütfen öğrenmek istediğiniz konuyu girin.")
            return
        }

        setIsLoading(true)
        setStep("generating")

        try {
            const res = await fetch("/api/ai/learning-path/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic, goal, depth })
            })

            const textResponse = await res.text();
            let data;

            try {
                data = JSON.parse(textResponse);
            } catch (err) {
                console.error("Non-JSON Response received:", textResponse);
                throw new Error("Sunucu geçersiz bir format gönderdi. Lütfen tekrar deneyin.");
            }

            if (!res.ok) {
                throw new Error(data.error || "Müfredat oluşturulurken bir hata oluştu.")
            }

            if (data.syllabus) {
                setSyllabus(data.syllabus)
                setStep("review")
            } else {
                throw new Error("Yapay zeka herhangi bir müfredat döndürmedi.")
            }
        } catch (error: unknown) {
            console.error(error)
            const msg = error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu."
            setErrorMsg(msg)
            setStep("input")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDynamicAction = async (action: string) => {
        setIsLoading(true);
        setErrorMsg("");

        let instruction = "";
        if (action === "expand") {
            instruction = "Genişlet: Mevcut müfredata daha fazla alt başlık ve detay ekle. Adım sayısını 2-3 adet artırabilirsin.";
        } else if (action === "condense") {
            instruction = "Kısalt: Müfredatı daha öz hale getir, gereksiz veya çok benzer adımları birleştir. Daha az adım olsun.";
        } else if (action === "technical") {
            instruction = "Daha Akademik: İçeriği daha bilimsel, akademik ve derinlemesine terimlerle güncelle. Tonu ciddileştir.";
        }

        try {
            const res = await fetch("/api/ai/learning-path/modify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic,
                    depth,
                    instruction,
                    syllabus,
                    language: "tr"
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Güncelleme başarısız.");

            if (data.syllabus) {
                setSyllabus(data.syllabus);
                toast({
                    title: "Başarılı",
                    description: "Müfredat yapay zeka tarafından güncellendi.",
                });
            }
        } catch (error: any) {
            console.error(error);
            setErrorMsg(error.message || "Müfredat güncellenirken bir hata oluştu.");
            toast({
                title: "Hata",
                description: error.message || "Güncelleme yapılamadı.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }

    const handleRemoveItem = (indexToRemove: number) => {
        setSyllabus((prev: SyllabusItem[]) => prev.filter((_: SyllabusItem, i: number) => i !== indexToRemove))
    }

    const handleStartJourney = async () => {
        setIsLoading(true);
        setErrorMsg("");

        try {
            const res = await fetch("/api/ai/learning-path/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic,
                    depth,
                    syllabus
                })
            });

            const textResponse = await res.text();
            let data;

            try {
                data = JSON.parse(textResponse);
            } catch (err) {
                console.error("Non-JSON API start Response:", textResponse);
                const snippet = textResponse.substring(0, 150) + "...";
                throw new Error(`Sunucu işleminizi başlatamadı. Dönen Yanıt: ${snippet}`);
            }

            if (!res.ok) {
                throw new Error(data?.error || "Öğrenme yolculuğu başlatılamadı.");
            }

            if (data?.journeyId) {
                router.push(`/dashboard/learning/j/${data.journeyId}`);
            } else {
                throw new Error("Geçersiz yanıt: Yolculuk ID'si eksik.");
            }

        } catch (error: any) {
            console.error(error);
            setErrorMsg(error.message || "Beklenmeyen bir hata oluştu.");
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-[calc(100vh-80px)] w-full py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
            {/* Ambient Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[140px] mix-blend-screen" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 dark:bg-emerald-500/5 rounded-full blur-[160px] mix-blend-screen" />
            </div>

            <div className="relative z-10 w-full max-w-3xl flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Header Section */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-300 ring-1 ring-indigo-500/20 mb-4 transition-all hover:ring-indigo-500/40 cursor-default">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs font-semibold tracking-wider uppercase">Yapay Zeka Destekli Öğrenim</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                            Yeni Bir Şeyler
                        </span> Öğrenin.
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                        Öğrenmek istediğiniz konuyu ve hedefinizi belirtin, sizin için anında adım adım, vizyoner bir müfredat oluşturalım.
                    </p>
                </div>

                {errorMsg && (
                    <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400 backdrop-blur-md rounded-2xl">
                        <XCircle className="h-5 w-5" />
                        <AlertTitle className="font-semibold">Bir sorun oluştu</AlertTitle>
                        <AlertDescription>{errorMsg}</AlertDescription>
                    </Alert>
                )}

                {/* Main Card */}
                <Card className="rounded-3xl border-slate-200/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl shadow-2xl shadow-indigo-500/5 overflow-hidden">

                    {step === "input" && (
                        <div className="animate-in fade-in zoom-in-95 duration-500">
                            <form onSubmit={handleGenerate}>
                                <CardContent className="p-8 space-y-8">
                                    <div className="space-y-3">
                                        <Label htmlFor="topic" className="text-base font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <Target className="w-4 h-4 text-indigo-500" /> Neyi Öğrenmek İstiyorsunuz?
                                        </Label>
                                        <Input
                                            id="topic"
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            placeholder="Örn: Kuantum Fiziği, Roma İmparatorluğu Tarihi, Next.js..."
                                            required
                                            className="h-14 text-lg bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500 transition-all placeholder:text-slate-400"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <Label htmlFor="goal" className="text-base font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <BookOpen className="w-4 h-4 text-purple-500" /> Kişisel Hedefiniz Nedir?
                                        </Label>
                                        <Textarea
                                            id="goal"
                                            value={goal}
                                            onChange={(e) => setGoal(e.target.value)}
                                            placeholder="Örn: Bu konuda uzmanlaşmak ve kendi projelerimde kullanmak istiyorum..."
                                            className="min-h-[100px] resize-none bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-purple-500/50 focus-visible:border-purple-500 transition-all placeholder:text-slate-400"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <Label className="text-base font-semibold text-slate-700 dark:text-slate-300">Öğrenme Derinliği</Label>
                                            <Select value={depth} onValueChange={(val: "shallow" | "standard" | "deep") => setDepth(val)}>
                                                <SelectTrigger className="h-12 bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-xl">
                                                    <SelectValue placeholder="Standart" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="shallow">⚡ Yüzeysel (Hızlı Bakış)</SelectItem>
                                                    <SelectItem value="standard">📚 Standart (Dengeli)</SelectItem>
                                                    <SelectItem value="deep">🔬 Derinlemesine (Kapsamlı)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Upload Area (Disabled visually for now) */}
                                    {/* <div className="pt-6 border-t border-slate-200 dark:border-slate-800 border-dashed">
                                        <div className="group relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer text-center">
                                            <UploadCloud className="w-10 h-10 mx-auto text-slate-400 group-hover:text-indigo-500 transition-colors mb-3" />
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">İçerik Yükle (İsteğe Bağlı)</p>
                                            <p className="text-xs text-slate-500 mt-1">PDF, TXT, DOCX dosyaları desteklenir</p>
                                        </div>
                                    </div> */}
                                </CardContent>
                                <div className="p-8 pt-0 mt-4 relative z-20">
                                    <Button
                                        type="submit"
                                        disabled={isLoading || !topic.trim()}
                                        className="w-full h-14 rounded-2xl text-lg font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 group overflow-hidden relative"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                                        {isLoading ? (
                                            <span className="flex items-center gap-2 relative z-10">
                                                <BrandLoader size="sm" showBlur={false} /> Sihir Gerçekleşiyor...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2 relative z-10">
                                                <BrainCircuit className="w-5 h-5" /> Yapay Zeka ile Müfredat Oluştur
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {step === "generating" && (
                        <CardContent className="p-16 flex flex-col items-center justify-center min-h-[400px] text-center animate-in fade-in duration-700">
                            <div className="relative mb-8 group">
                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-pink-500 rounded-full blur-[40px] opacity-40 animate-pulse" />
                                <div className="relative w-24 h-24 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800 rotate-3 transition-transform group-hover:rotate-6">
                                    <BrainCircuit className="w-12 h-12 text-indigo-500" />
                                </div>
                                <div className="absolute -top-4 -right-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-bounce shadow-lg">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Bilgi Ağları Örülüyor...</h2>
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                                Gelişmiş yapay zeka modelimiz sizin için en uygun öğrenme yolculuğunu piyon piyon hesaplıyor. Lütfen bekleyin.
                            </p>
                        </CardContent>
                    )}

                    {step === "review" && (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <CardHeader className="p-8 pb-4 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-950/20">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                                            <CheckCircle2 className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl text-slate-900 dark:text-white">Müfredatınız Hazır</CardTitle>
                                            <CardDescription className="text-base mt-1">İşte sizin için kişiselleştirilmiş öğrenme planı.</CardDescription>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-8 space-y-6">
                                {/* AI Modifiers Tool Bar */}
                                <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/50 inline-flex flex-wrap gap-1 shadow-inner border border-slate-200/50 dark:border-slate-700/50">
                                    <Button variant="ghost" size="sm" onClick={() => handleDynamicAction('expand')} disabled={isLoading} className="rounded-xl hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm text-slate-600 dark:text-slate-300 font-medium h-9 px-4">
                                        <Plus className="w-4 h-4 mr-2 text-indigo-500" /> Genişlet
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDynamicAction('condense')} disabled={isLoading} className="rounded-xl hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm text-slate-600 dark:text-slate-300 font-medium h-9 px-4">
                                        <Minus className="w-4 h-4 mr-2 text-pink-500" /> Kısalt
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDynamicAction('technical')} disabled={isLoading} className="rounded-xl hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm text-slate-600 dark:text-slate-300 font-medium h-9 px-4">
                                        <Settings2 className="w-4 h-4 mr-2 text-blue-500" /> Daha Akademik
                                    </Button>
                                </div>

                                {/* Modern Timeline Syllabus List */}
                                <div className="relative pl-6 space-y-8 before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-gradient-to-b before:from-indigo-500 before:via-purple-500 before:to-pink-500 before:rounded-full">
                                    {isLoading && (
                                        <div className="absolute inset-0 bg-white/60 dark:bg-slate-950/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-2xl">
                                            <BrandLoader size="lg" />
                                        </div>
                                    )}

                                    {syllabus.map((item: SyllabusItem, idx: number) => (
                                        <div key={idx} className="relative group">
                                            {/* Process Dot */}
                                            <div className="absolute -left-6 top-1 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-[3px] border-indigo-500 flex items-center justify-center group-hover:scale-125 transition-transform shadow-md shadow-indigo-500/20 z-10">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 group-hover:bg-pink-500 transition-colors" />
                                            </div>

                                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm group-hover:shadow-md transition-all group-hover:border-indigo-500/30 flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                        <span className="text-sm font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md whitespace-nowrap">
                                                            Adım {item.order || idx + 1}
                                                        </span>
                                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                                                            {item.title}
                                                        </h3>
                                                    </div>
                                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                                                        {item.overview}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full h-8 w-8 shrink-0 -mt-1 -mr-1"
                                                    onClick={() => handleRemoveItem(idx)}
                                                    title="Adımı Kaldır"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}

                                    {syllabus.length === 0 && (
                                        <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                            <p className="text-slate-500">Müfredat listesi boş görünüyor. Önceki adıma dönerek yeniden oluşturmayı deneyin.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>

                            <CardFooter className="p-8 pt-4 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800 flex flex-col items-end rounded-b-3xl">
                                <div className="flex flex-col sm:flex-row gap-4 items-center sm:justify-end w-full mb-3">
                                    <Button
                                        variant="outline"
                                        className="w-full sm:w-auto text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white h-12 rounded-xl"
                                        onClick={() => setStep("input")}
                                        disabled={isLoading}
                                    >
                                        Geri Dön
                                    </Button>
                                    <Button
                                        className="w-full sm:w-auto flex-1 sm:flex-none px-6 h-12 rounded-xl bg-slate-900 hover:bg-indigo-600 disabled:opacity-50 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-indigo-500 dark:hover:text-white transition-colors shadow-xl shadow-slate-900/10 dark:shadow-none font-semibold text-sm sm:text-base group whitespace-nowrap"
                                        disabled={isLoading || syllabus.length === 0}
                                        onClick={handleStartJourney}
                                    >
                                        <Zap className="w-4 h-4 mr-2 shrink-0 group-hover:animate-pulse" />
                                        <span className="truncate">Maceraya Başla</span>
                                        <ArrowRight className="w-4 h-4 ml-2 shrink-0 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </div>

                            </CardFooter>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
}
