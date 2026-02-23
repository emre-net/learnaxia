"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Cpu, ArrowLeft, Upload, FileUp, Sparkles } from "lucide-react"
import Link from "next/link"

export default function AiNotePage() {
    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/create">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">AI Not Atölyesi</h1>
                    <p className="text-slate-400">PDF yükleyin, AI sizin için en önemli yerleri analiz edip notlara dönüştürsün.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="bg-slate-900/50 border-slate-800 flex flex-col items-center justify-center p-12 text-center group cursor-pointer hover:border-purple-500/30 transition-all shadow-2xl shadow-purple-500/5">
                    <div className="p-6 rounded-3xl bg-purple-500/10 text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                        <FileUp className="h-12 w-12" />
                    </div>
                    <CardTitle className="text-2xl mb-2">PDF Dosyası Yükle</CardTitle>
                    <CardDescription className="max-w-xs">
                        Ders notlarınızı, kitap bölümlerini veya makaleleri buraya sürükleyin.
                    </CardDescription>
                    <Button className="mt-8 bg-purple-600 hover:bg-purple-700 font-bold px-8">
                        <Upload className="mr-2 h-4 w-4" /> Dosya Seç
                    </Button>
                </Card>

                <Card className="bg-slate-900/50 border-slate-800 p-8 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Nasıl Çalışır?</h2>
                    </div>
                    <ul className="space-y-6">
                        {[
                            { step: "1", text: "PDF dosyanızı sol taraftaki alandan yükleyin." },
                            { step: "2", text: "AI içeriğin yapısını, anahtar kavramları ve önemli detayları analiz eder." },
                            { step: "3", text: "Sizin için hiyerarşik ve düzenli çalışma notları oluşturulur." },
                            { step: "4", text: "Üretilen notları düzenleyip kütüphanenize kaydedebilirsiniz." }
                        ].map((item) => (
                            <li key={item.step} className="flex gap-4">
                                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-bold border border-slate-700">
                                    {item.step}
                                </span>
                                <p className="text-sm text-slate-400 font-medium">{item.text}</p>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </div>
    )
}
