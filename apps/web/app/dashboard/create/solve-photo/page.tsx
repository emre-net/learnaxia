"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Save, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { BrandLoader } from "@/components/ui/brand-loader";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/lib/i18n/i18n";
import { RichMathText } from "@/components/shared/rich-math-text";
import { TokenWalletCard } from "@/components/tokens/token-wallet-card";

async function resizeImageToDataUrl(file: File, maxDim = 640): Promise<string> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new window.Image();
            img.onload = () => {
                const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
                const w = Math.max(1, Math.round(img.width * scale));
                const h = Math.max(1, Math.round(img.height * scale));
                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    resolve(typeof reader.result === "string" ? reader.result : "");
                    return;
                }
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL("image/jpeg", 0.72));
            };
            img.onerror = () => resolve(typeof reader.result === "string" ? reader.result : "");
            img.src = typeof reader.result === "string" ? reader.result : "";
        };
        reader.onerror = () => resolve("");
        reader.readAsDataURL(file);
    });
}

function SolvePhotoContent() {
    const searchParams = useSearchParams();
    const existingId = searchParams.get("id");

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<{ id?: string; questionText: string; solution: string } | null>(null);
    const [note, setNote] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation();

    useEffect(() => {
        if (!existingId) return;
        fetch("/api/solved-questions")
            .then((r) => (r.ok ? r.json() : []))
            .then((list: any[]) => {
                const found = Array.isArray(list) ? list.find((s) => s.id === existingId) : null;
                if (found) {
                    setResult({ id: found.id, questionText: found.questionText, solution: found.solution });
                    if (found.imageUrl && (found.imageUrl.startsWith("http") || found.imageUrl.startsWith("data:image/"))) {
                        setPreview(found.imageUrl);
                    }
                    if (Array.isArray(found.notes) && found.notes[0]?.content) {
                        setNote(found.notes[0].content);
                    }
                }
            })
            .catch(() => {});
    }, [existingId]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            const dataUrl = await resizeImageToDataUrl(selectedFile, 640);
            setPreview(dataUrl || URL.createObjectURL(selectedFile));
            setResult(null);
            setError(null);
        }
    };

    const handleSolve = async () => {
        if (!file) return;

        setIsAnalyzing(true);
        setError(null);
        setResult(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/ai/solve-photo", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Bir hata oluştu.");
                return;
            }

            setResult(data);
        } catch {
            setError(t("solvePhoto.errors.generic"));
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSave = async () => {
        if (!result) return;

        setIsSaving(true);
        try {
            if (result.id) {
                const res = await fetch(`/api/solved-questions/${result.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ note, title: "AI Çözüm Notu" }),
                });
                if (!res.ok) throw new Error("Not kaydedilemedi");
            } else {
                const safeImage = preview && preview.startsWith("data:image/") ? preview : "";
                const res = await fetch("/api/solved-questions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        questionText: result.questionText,
                        solution: result.solution,
                        imageUrl: safeImage,
                        note
                    }),
                });
                if (!res.ok) throw new Error("Kaydedilemedi");
            }

            toast({
                title: t("common.success"),
                description: "Çözüm kütüphaneye kaydedildi.",
            });

            router.push("/dashboard/library?tab=ai-solutions");
        } catch {
            toast({
                variant: "destructive",
                title: t("common.error"),
                description: t("solvePhoto.errors.generic"),
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="container max-w-4xl py-8 space-y-8 text-zinc-100">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-zinc-300 hover:bg-zinc-800">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("solvePhoto.title")}</h1>
                    <p className="text-sm text-zinc-400">{t("solvePhoto.description")}</p>
                </div>
            </div>

            <TokenWalletCard compact refreshSignal={result ? 1 : 0} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upload Section */}
                <Card className="h-fit bg-[#121215] border-white/[0.08]">
                    <CardHeader>
                        <CardTitle className="text-lg text-zinc-100">Soru Görseli</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div
                            className="border-2 border-dashed border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 hover:border-sky-500/50 transition-colors cursor-pointer bg-[#18181b]/60"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {preview ? (
                                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-zinc-800 bg-[#09090b]">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                                </div>
                            ) : (
                                <>
                                    <div className="h-16 w-16 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                                        <Camera className="h-8 w-8" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-medium text-zinc-200">{t("solvePhoto.uploadPhoto")}</p>
                                        <p className="text-sm text-zinc-400 mt-1">{t("solvePhoto.errors.noQuestion")}</p>
                                    </div>
                                </>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>

                        {error && (
                            <div className="flex items-start gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <Button
                            className="w-full bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold h-11 rounded-xl"
                            disabled={!file || isAnalyzing}
                            onClick={handleSolve}
                        >
                            {isAnalyzing ? (
                                <><BrandLoader size="sm" className="mr-2" /> {t("solvePhoto.solving")}</>
                            ) : (
                                t("solvePhoto.title")
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Result Section */}
                <div className="space-y-6">
                    {result ? (
                        <>
                            <Card className="bg-[#121215] border-emerald-500/30">
                                <CardHeader className="bg-emerald-500/10 border-b border-emerald-500/15">
                                    <CardTitle className="text-lg flex items-center gap-2 text-emerald-300">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                        AI Çözümü
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-5">
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-xs text-zinc-400">{t("study.questionLabel")}</h4>
                                        <div className="text-sm bg-[#18181b] p-3.5 rounded-xl border border-zinc-800 text-zinc-200">
                                            <RichMathText text={result.questionText} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-xs text-zinc-400">{t("solvePhoto.solution")}</h4>
                                        <div className="text-[15px] leading-relaxed text-zinc-100 bg-[#18181b] p-4 rounded-xl border border-emerald-500/20">
                                            <RichMathText text={result.solution} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-[#121215] border-white/[0.08]">
                                <CardHeader>
                                    <CardTitle className="text-lg text-zinc-100">{t("solvePhoto.takeNote")}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        placeholder="Bu çözüm hakkında hatırlaman gereken bir şey var mı?"
                                        className="min-h-[100px] bg-[#18181b] border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                    />
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold h-11 rounded-xl"
                                        onClick={handleSave}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <><BrandLoader size="sm" className="mr-2" /> {t("common.save")}...</>
                                        ) : (
                                            <><Save className="h-4 w-4 mr-2" /> {result.id ? "Notu Güncelle / Kaydet" : t("solvePhoto.saveToLibrary")}</>
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </>
                    ) : (
                        <Card className="h-full min-h-[260px] flex items-center justify-center p-12 border-dashed border-zinc-800 bg-[#121215]/50">
                            <div className="text-center space-y-3">
                                <BrandLoader size="md" className={isAnalyzing ? 'animate-pulse mx-auto' : 'mx-auto opacity-60'} />
                                <p className="text-sm font-medium text-zinc-400">
                                    {isAnalyzing ? t("solvePhoto.solving") : t("solvePhoto.noHistory")}
                                </p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function SolvePhotoPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><BrandLoader size="lg" /></div>}>
            <SolvePhotoContent />
        </Suspense>
    );
}
