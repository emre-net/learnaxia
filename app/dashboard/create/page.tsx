"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Plus,
    Sparkles,
    ArrowRight,
    BrainCircuit,
    FileText,
    FolderPlus,
    Camera,
    PenTool,
    Cpu,
    Zap
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function AtölyePage() {
    const pillars = [
        {
            id: "modules",
            title: "Modüller",
            description: "Öğrenme kartları ve testler oluşturun.",
            icon: BrainCircuit,
            color: "blue",
            actions: [
                {
                    label: "Manuel Oluştur",
                    description: "Kendi içeriğinizi elle girin.",
                    icon: PenTool,
                    href: "/dashboard/create/manual",
                    type: "manual"
                },
                {
                    label: "Zeka ile Üret",
                    description: "Metin veya dosyadan AI ile üretin.",
                    icon: Sparkles,
                    href: "/dashboard/create/ai",
                    type: "ai"
                }
            ]
        },
        {
            id: "collections",
            title: "Koleksiyonlar",
            description: "Modülleri tematik setlerde birleştirin.",
            icon: FolderPlus,
            color: "indigo",
            actions: [
                {
                    label: "Yeni Koleksiyon",
                    description: "Modüllerinizi gruplandırın.",
                    icon: Plus,
                    href: "/dashboard/collections/new",
                    type: "manual"
                }
            ]
        },
        {
            id: "notes",
            title: "Notlar",
            description: "Ders notları ve çalışma dokümanları.",
            icon: FileText,
            color: "amber",
            actions: [
                {
                    label: "Not Yaz",
                    description: "Zengin metin editörü ile not alın.",
                    icon: PenTool,
                    href: "/dashboard/create/manual-note",
                    type: "manual"
                },
                {
                    label: "PDF'den Not Çıkar",
                    description: "AI PDF içeriğini notlara dönüştürsün.",
                    icon: Cpu,
                    href: "/dashboard/create/ai-notes",
                    type: "ai"
                }
            ]
        }
    ]

    return (
        <div className="flex-1 space-y-8 p-1 sm:p-4 md:p-8 pt-6 min-h-screen bg-transparent">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full -ml-20 -mb-20" />

                <div className="relative z-10 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 shadow-lg shadow-blue-500/20">
                            <Zap className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-1">
                            Atölye
                        </h1>
                    </div>
                    <p className="text-slate-400 text-lg max-w-2xl font-medium ml-12">
                        Öğrenme sistemini inşa et. Modüller üret, koleksiyonlar kur ve AI destekli notlar al.
                    </p>
                </div>
            </div>

            {/* Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {pillars.map((pillar) => (
                    <div key={pillar.id} className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 px-2">
                            <pillar.icon className={cn(
                                "h-5 w-5",
                                pillar.color === "blue" && "text-blue-400",
                                pillar.color === "indigo" && "text-indigo-400",
                                pillar.color === "amber" && "text-amber-400"
                            )} />
                            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">
                                {pillar.title}
                            </h2>
                        </div>

                        <Card className="h-full bg-slate-900/50 border-slate-800 backdrop-blur-sm hover:border-slate-700/50 transition-colors shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-xl text-white">{pillar.title} Atölyesi</CardTitle>
                                <CardDescription className="text-slate-400">
                                    {pillar.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {pillar.actions.map((action) => (
                                    <Link key={action.label} href={action.href}>
                                        <div className={cn(
                                            "group relative flex items-center gap-4 p-4 rounded-xl border border-transparent transition-all duration-300 cursor-pointer overflow-hidden mb-3",
                                            action.type === "ai"
                                                ? "bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500/30"
                                                : "bg-slate-800/40 hover:bg-slate-800/60 hover:border-slate-700/50"
                                        )}>
                                            <div className={cn(
                                                "p-2.5 rounded-lg shrink-0 transition-transform group-hover:scale-110",
                                                action.type === "ai" ? "bg-purple-500/20 text-purple-400" : "bg-slate-700/50 text-slate-300"
                                            )}>
                                                <action.icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                                                        {action.label}
                                                    </h3>
                                                    <ArrowRight className="h-4 w-4 text-slate-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                                </div>
                                                <p className="text-[11px] text-slate-500 group-hover:text-slate-400 transition-colors">
                                                    {action.description}
                                                </p>
                                            </div>

                                            {action.type === "ai" && (
                                                <div className="absolute top-0 right-0 py-1 px-2 bg-purple-500/20 rounded-bl-lg border-l border-b border-purple-500/30 flex items-center gap-1">
                                                    <Sparkles className="h-2.5 w-2.5 text-purple-400" />
                                                    <span className="text-[8px] font-bold text-purple-400 uppercase tracking-tighter">AI</span>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                ))}
            </div>

            {/* Extra Tools Section */}
            <div className="mt-8 border-t border-slate-800 pt-8">
                <div className="flex items-center gap-3 mb-6">
                    <Camera className="h-5 w-5 text-emerald-400" />
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">
                        Hızlı Araçlar
                    </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-12">
                    <Link href="/dashboard/create/solve-photo">
                        <div className="group flex items-center gap-4 p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all cursor-pointer">
                            <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
                                <Camera className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold">Fotoğraftan Soru Çöz</h3>
                                <p className="text-xs text-slate-400">Kitaplardan soru çekin, AI anında çözsün.</p>
                            </div>
                            <div className="ml-auto p-2 rounded-full bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="h-4 w-4 text-emerald-400" />
                            </div>
                        </div>
                    </Link>
                    <Link href="/dashboard/learning/create">
                        <div className="group flex items-center gap-4 p-5 rounded-2xl bg-zinc-500/5 border border-zinc-500/10 hover:bg-zinc-500/10 hover:border-zinc-500/30 transition-all cursor-pointer">
                            <div className="p-3 bg-zinc-500/20 rounded-xl text-zinc-400 group-hover:scale-110 transition-transform">
                                <Zap className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold">Öğrenme Rotası</h3>
                                <p className="text-xs text-slate-400">Kişiselleştirilmiş çalışma planı oluşturun.</p>
                            </div>
                            <div className="ml-auto p-2 rounded-full bg-zinc-500/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="h-4 w-4 text-zinc-400" />
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    )
}
