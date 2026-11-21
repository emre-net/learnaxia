"use client"

import {
    Sparkles,
    FileText,
    FolderPlus,
    Camera,
    PenTool,
    ChevronRight,
    Map
} from "lucide-react"
import Link from "next/link"

export default function AtölyePage() {
    return (
        <div className="flex-1 space-y-8 p-1 sm:p-4 md:p-8 pt-6 min-h-screen bg-transparent">
            {/* Header Section */}
            <div className="relative z-10 flex flex-col gap-2 mb-8">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#f4f4f5] mb-1">
                    Atölye
                </h1>
                <p className="text-[#a1a1aa] text-base sm:text-lg max-w-2xl font-medium">
                    Öğrenme materyallerini yapay zeka ile dönüştür veya kendi setlerini üret.
                </p>
            </div>

            {/* Primary AI Actions (Shortcuts Style Bento) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {/* Large Bento Card */}
                <Link href="/dashboard/create/solve-photo" className="group h-full">
                    <div className="h-full min-h-[200px] sm:min-h-[220px] flex flex-col justify-between p-6 bg-[#121215] border border-white/10 hover:border-indigo-500/50 rounded-3xl transition-all shadow-xl">
                        <div className="flex items-start">
                            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                                <Camera className="h-7 w-7 transition-transform group-hover:scale-110" />
                            </div>
                        </div>
                        <div className="mt-auto">
                            <h3 className="text-xl sm:text-2xl font-bold text-[#f4f4f5] mb-2 tracking-tight group-hover:text-indigo-400 transition-colors">
                                Kameradan Çöz
                            </h3>
                            <p className="text-[#a1a1aa] text-sm">
                                Kitaplardan veya ekrandan soru çek, yapay zeka anında adım adım çözümlesin.
                            </p>
                        </div>
                    </div>
                </Link>

                {/* Right Column Small Cards */}
                <div className="flex flex-col gap-4">
                    <Link href="/dashboard/create/ai-notes" className="group flex-1">
                        <div className="h-full flex flex-col justify-center p-6 bg-[#121215] border border-white/10 hover:border-purple-500/50 rounded-3xl transition-all shadow-xl">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                                    <FileText className="h-5 w-5 transition-transform group-hover:scale-110" />
                                </div>
                                <h3 className="text-lg font-semibold text-[#f4f4f5] group-hover:text-purple-400 transition-colors">
                                    PDF'den Not Çıkar
                                </h3>
                            </div>
                            <p className="text-[#a1a1aa] text-xs">
                                Uzun dokümanları saniyeler içinde çalışma notlarına özetlesin.
                            </p>
                        </div>
                    </Link>

                    <Link href="/dashboard/create/ai" className="group flex-1">
                        <div className="h-full flex flex-col justify-center p-6 bg-[#121215] border border-white/10 hover:border-sky-500/50 rounded-3xl transition-all shadow-xl relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                                    <Sparkles className="h-5 w-5 transition-transform group-hover:scale-110" />
                                </div>
                                <h3 className="text-lg font-semibold text-[#f4f4f5] group-hover:text-sky-400 transition-colors">
                                    Zeka ile Üret
                                </h3>
                            </div>
                            <p className="text-[#a1a1aa] text-xs">
                                Konu başlığı girerek 4 soru tipinde kartlar oluşturun.
                            </p>
                            
                            {/* AI Badge */}
                            <div className="absolute top-0 right-0 py-1 px-2.5 bg-indigo-500/15 rounded-bl-xl border-l border-b border-indigo-500/30 flex items-center gap-1">
                                <Sparkles className="h-3 w-3 text-indigo-400" />
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">AI</span>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Section Divider */}
            <h2 className="text-xs font-bold text-[#71717a] uppercase tracking-widest mb-4 ml-2">
                Klasik Araçlar
            </h2>

            {/* List Actions */}
            <div className="bg-[#121215] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
                {/* Manual Module Create */}
                <Link href="/dashboard/create/manual" className="group flex items-center p-4 sm:p-5 hover:bg-white/5 transition-colors">
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mr-4 group-hover:bg-indigo-500/20 transition-colors">
                        <PenTool className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm sm:text-base font-semibold text-[#f4f4f5] mb-0.5 group-hover:text-indigo-400 transition-colors">
                            Manuel Modül Oluştur
                        </h3>
                        <p className="text-xs sm:text-sm text-[#a1a1aa]">4 soru tipinden birini seçip kartlarınızı oluşturun.</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[#71717a] group-hover:text-[#f4f4f5]" />
                </Link>
                <div className="h-px bg-white/10 ml-[70px]" />

                {/* Learning Journey */}
                <Link href="/dashboard/learning/create" className="group flex items-center p-4 sm:p-5 hover:bg-white/5 transition-colors">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-4 group-hover:bg-emerald-500/20 transition-colors">
                        <Map className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm sm:text-base font-semibold text-[#f4f4f5] mb-0.5 group-hover:text-emerald-400 transition-colors">
                            Öğrenme Rotası
                        </h3>
                        <p className="text-xs sm:text-sm text-[#a1a1aa]">Adım adım interaktif bir çalışma yolculuğu tasarlayın.</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[#71717a] group-hover:text-[#f4f4f5]" />
                </Link>
                <div className="h-px bg-white/10 ml-[70px]" />

                {/* Manual Note Write */}
                <Link href="/dashboard/create/manual-note" className="group flex items-center p-4 sm:p-5 hover:bg-white/5 transition-colors">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center mr-4 group-hover:bg-amber-500/20 transition-colors">
                        <FileText className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm sm:text-base font-semibold text-[#f4f4f5] mb-0.5 group-hover:text-amber-400 transition-colors">
                            Not Yaz
                        </h3>
                        <p className="text-xs sm:text-sm text-[#a1a1aa]">Zengin metin editörü ile serbest formda not alın.</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[#71717a] group-hover:text-[#f4f4f5]" />
                </Link>
                <div className="h-px bg-white/10 ml-[70px]" />

                {/* New Collection */}
                <Link href="/dashboard/collections/new" className="group flex items-center p-4 sm:p-5 hover:bg-white/5 transition-colors">
                    <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center mr-4 group-hover:bg-purple-500/20 transition-colors">
                        <FolderPlus className="h-5 w-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm sm:text-base font-semibold text-[#f4f4f5] mb-0.5 group-hover:text-purple-400 transition-colors">
                            Yeni Koleksiyon
                        </h3>
                        <p className="text-xs sm:text-sm text-[#a1a1aa]">Modüllerinizi ve setlerinizi klasörlerde toplayın.</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[#71717a] group-hover:text-[#f4f4f5]" />
                </Link>
            </div>
        </div>
    )
}
