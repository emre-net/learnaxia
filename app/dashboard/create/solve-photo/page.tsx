
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Upload, Loader2, Save, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";

export default function SolvePhotoPage() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<{ questionText: string; solution: string } | null>(null);
    const [note, setNote] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
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
        } catch (err) {
            setError("Sunucu ile bağlantı kurulamadı.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSave = async () => {
        if (!result) return;

        setIsSaving(true);
        try {
            const res = await fetch("/api/solved-questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    questionText: result.questionText,
                    solution: result.solution,
                    imageUrl: preview, // Note: In production, upload to S3 first
                    note
                }),
            });

            if (!res.ok) throw new Error("Kaydedilemedi");

            toast({
                title: "Başarılı!",
                description: "Çözüm ve notunuz kütüphanenize kaydedildi.",
            });

            router.push("/dashboard/library?tab=ai-solutions");
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Hata",
                description: "Kaydedilirken bir hata oluştu.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="container max-w-4xl py-8 space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Fotoğraftan Soru Çöz</h1>
                    <p className="text-muted-foreground">AI ile anında çözüm ve analiz alın.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upload Section */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg">Görsel Yükle</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div
                            className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:border-emerald-500/50 transition-colors cursor-pointer bg-emerald-50/10"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {preview ? (
                                <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                                    <Image src={preview} alt="Preview" fill className="object-contain" />
                                </div>
                            ) : (
                                <>
                                    <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                        <Camera className="h-8 w-8" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-medium">Fotoğraf Çek veya Yükle</p>
                                        <p className="text-sm text-muted-foreground mt-1">Soru net ve okunabilir olmalıdır.</p>
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
                            <div className="flex items-start gap-2 p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 h-11"
                            disabled={!file || isAnalyzing}
                            onClick={handleSolve}
                        >
                            {isAnalyzing ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analiz Ediliyor...</>
                            ) : (
                                "Sorumu Çöz"
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Result Section */}
                <div className="space-y-6">
                    {result ? (
                        <>
                            <Card className="border-emerald-500/30">
                                <CardHeader className="bg-emerald-50/50">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                        AI Çözümü
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider">Tespit Edilen Soru</h4>
                                        <p className="text-sm bg-muted/50 p-3 rounded-lg border">{result.questionText}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider">Adım Adım Çözüm</h4>
                                        <div className="whitespace-pre-wrap text-[15px] leading-relaxed italic text-foreground/90 bg-emerald-50/20 p-4 rounded-xl border border-emerald-100/50 shadow-sm">
                                            {result.solution}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Kişisel Notun</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        placeholder="Bu çözüm hakkında hatırlaman gereken bir şey var mı?"
                                        className="min-h-[100px] bg-muted/20"
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                    />
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 h-11"
                                        onClick={handleSave}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Kaydediliyor...</>
                                        ) : (
                                            <><Save className="h-4 w-4 mr-2" /> Kütüphaneye Kaydet</>
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </>
                    ) : (
                        <Card className="h-full flex items-center justify-center p-12 border-dashed opacity-50">
                            <div className="text-center space-y-2">
                                <Loader2 className={`h-8 w-8 mx-auto text-muted-foreground ${isAnalyzing ? 'animate-spin' : ''}`} />
                                <p className="text-sm font-medium">
                                    {isAnalyzing ? "AI soruyu analiz ediyor..." : "Henüz bir soru çözülmedi."}
                                </p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
