"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Plus,
    Sparkles,
    ArrowRight,
    FileText,
    FolderPlus,
    Camera,
    PenTool,
    ChevronRight,
    Map
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function AtölyePage() {
    return (
        <div className="flex-1 space-y-8 p-1 sm:p-4 md:p-8 pt-6 min-h-screen bg-transparent">
            {/* Header Section */}
            <div className="relative z-10 flex flex-col gap-2 mb-8">
                <h1 className="text-4xl font-extrabold tracking-tight text-white mb-1">
                    Atölye
                </h1>
                <p className="text-slate-400 text-lg max-w-2xl font-medium">
                    Öğrenme materyallerini zeka ile dönüştür veya kendi notlarını oluştur.
                </p>
            </div>

            {/* Primary AI Actions (Shortcuts Style Bento) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {/* Large Bento Card */}
                <Link href="/dashboard/create/solve-photo" className="group h-full">
                    <div className="h-full min-h-[220px] flex flex-col justify-between p-6 bg-[#0A0A0A] border border-[#111111] hover:border-slate-800 rounded-3xl transition-all shadow-xl">
                        <div className="flex items-start">
                            <Camera className="h-8 w-8 text-white transition-transform group-hover:scale-110" />
                        </div>
                        <div className="mt-auto">
                            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight group-hover:text-blue-400 transition-colors">
                                Kameradan Çöz
                            </h3>
                            <p className="text-slate-400 text-sm">
                                Kitaplardan veya ekranlardan soru çek, AI anında çözümlesin.
                            </p>
                        </div>
                    </div>
                </Link>

                {/* Right Column Small Cards */}
                <div className="flex flex-col gap-4">
                    <Link href="/dashboard/create/ai-notes" className="group flex-1">
                        <div className="h-full flex flex-col justify-center p-6 bg-[#0A0A0A] border border-[#111111] hover:border-slate-800 rounded-3xl transition-all shadow-xl">
                            <FileText className="h-6 w-6 text-white mb-3 transition-transform group-hover:scale-110" />
                            <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-purple-400 transition-colors">
                                PDF'den Not Çıkar
                            </h3>
                            <p className="text-slate-400 text-xs">
                                AI uzun dokümanları saniyeler içinde özetlesin.
                            </p>
                        </div>
                    </Link>

                    <Link href="/dashboard/create/ai" className="group flex-1">
                        <div className="h-full flex flex-col justify-center p-6 bg-[#0A0A0A] border border-[#111111] hover:border-slate-800 rounded-3xl transition-all shadow-xl relative overflow-hidden">
                            <Sparkles className="h-6 w-6 text-white mb-3 transition-transform group-hover:scale-110" />
                            <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-indigo-400 transition-colors">
                                Zeka ile Üret
                            </h3>
                            <p className="text-slate-400 text-xs">
                                Konu başlığı girerek flashcard'lar oluşturun.
                            </p>
                            
                            {/* AI Badge */}
                            <div className="absolute top-0 right-0 py-1 px-2 bg-indigo-500/10 rounded-bl-lg border-l border-b border-indigo-500/20 flex items-center gap-1">
                                <Sparkles className="h-3 w-3 text-indigo-400" />
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">AI</span>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Section Divider */}
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 ml-2">
                Klasik Araçlar
            </h2>

            {/* List Actions */}
            <div className="bg-[#0A0A0A] border border-[#111111] rounded-3xl overflow-hidden shadow-xl">
                
                {/* Manual Module Create */}
                <Link href="/dashboard/create/manual" className="group flex items-center p-5 hover:bg-slate-900/50 transition-colors">
                    <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center mr-4 group-hover:bg-blue-500/20 transition-colors">
                        <PenTool className="h-5 w-5 text-white group-hover:text-blue-400 transition-colors" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">Manuel Modül Oluştur</h3>
                        <p className="text-sm text-slate-400">Kendi flashcard'larınızı tek tek elle yazın.</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-slate-400" />
                </Link>
                <div className="h-px bg-[#111111] ml-[76px]" />

                {/* Learning Journey */}
                <Link href="/dashboard/learning/create" className="group flex items-center p-5 hover:bg-slate-900/50 transition-colors">
                    <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center mr-4 group-hover:bg-emerald-500/20 transition-colors">
                        <Map className="h-5 w-5 text-white group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">Öğrenme Rotası</h3>
                        <p className="text-sm text-slate-400">Kişiselleştirilmiş bir çalışma planı oluşturun.</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-slate-400" />
                </Link>
                <div className="h-px bg-[#111111] ml-[76px]" />

                {/* Manual Note Write */}
                <Link href="/dashboard/create/manual-note" className="group flex items-center p-5 hover:bg-slate-900/50 transition-colors">
                    <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center mr-4 group-hover:bg-amber-500/20 transition-colors">
                        <FileText className="h-5 w-5 text-white group-hover:text-amber-400 transition-colors" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-semibold text-white mb-1 group-hover:text-amber-400 transition-colors">Not Yaz</h3>
                        <p className="text-sm text-slate-400">Zengin metin editörü ile serbest formda not alın.</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-slate-400" />
                </Link>
                <div className="h-px bg-[#111111] ml-[76px]" />

                {/* New Collection */}
                <Link href="/dashboard/collections/new" className="group flex items-center p-5 hover:bg-slate-900/50 transition-colors">
                    <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center mr-4 group-hover:bg-purple-500/20 transition-colors">
                        <FolderPlus className="h-5 w-5 text-white group-hover:text-purple-400 transition-colors" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-semibold text-white mb-1 group-hover:text-purple-400 transition-colors">Yeni Koleksiyon</h3>
                        <p className="text-sm text-slate-400">Modüllerinizi ve notlarınızı klasörlerde toplayın.</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-slate-400" />
                </Link>

            </div>
        </div>
    )
}
