import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Suspense } from "react"
import { AuthForm } from "@/components/auth/auth-form"
import { BrainCircuit, Zap, BookOpen, Sparkles, CheckCircle } from "lucide-react"

export const metadata: Metadata = {
    title: "Giriş Yap | Learnaxia",
    description: "Hesabına giriş yap veya yeni kayıt oluştur.",
}

const FEATURES = [
    {
        icon: BrainCircuit,
        color: "text-purple-400",
        bg: "bg-purple-500/15 border-purple-500/20",
        title: "Akıllı Tekrar Sistemi",
        desc: "SM-2 algoritması ile kişiselleştirilmiş öğrenme yolu",
        delay: "0s",
    },
    {
        icon: Sparkles,
        color: "text-cyan-400",
        bg: "bg-cyan-500/15 border-cyan-500/20",
        title: "Yapay Zeka ile Üret",
        desc: "Doküman ve notlarından saniyeler içinde flashcard",
        delay: "0.15s",
    },
    {
        icon: Zap,
        color: "text-amber-400",
        bg: "bg-amber-500/15 border-amber-500/20",
        title: "Hızlı Öğrenme",
        desc: "Odak modu ve Pomodoro timer ile verimli çalışma",
        delay: "0.3s",
    },
    {
        icon: CheckCircle,
        color: "text-emerald-400",
        bg: "bg-emerald-500/15 border-emerald-500/20",
        title: "İlerleme Takibi",
        desc: "Detaylı analitik ile güçlü ve zayıf yönlerini gör",
        delay: "0.45s",
    },
]

export default function LoginPage() {
    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-background">
            {/* Left Panel: Branding & Animated Features */}
            <div className="hidden md:flex flex-1 relative bg-slate-950 overflow-hidden flex-col justify-between p-12">
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-purple-900/40 to-slate-950 z-0" />

                {/* Animated glowing shapes */}
                <div
                    className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/30 blur-[120px] rounded-full pointer-events-none z-0"
                    style={{ animation: 'float 8s ease-in-out infinite' }}
                />
                <div
                    className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/30 blur-[120px] rounded-full pointer-events-none z-0"
                    style={{ animation: 'float 10s ease-in-out infinite reverse' }}
                />
                <div
                    className="absolute top-[40%] right-[10%] w-[30%] h-[30%] bg-cyan-600/20 blur-[80px] rounded-full pointer-events-none z-0"
                    style={{ animation: 'float 6s ease-in-out infinite 2s' }}
                />

                {/* Logo */}
                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-3">
                        <Image src="/logo.png" alt="Learnaxia Logo" width={80} height={80} className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(56,189,248,0.3)]" />
                        <span className="text-4xl font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-500 uppercase">
                            LEARNAXIA
                        </span>
                    </Link>
                </div>

                {/* Hero Text */}
                <div className="relative z-10 space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
                            Öğrenme yolculuğuna
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                                yapay zeka
                            </span>{" "}
                            ile yön ver.
                        </h1>
                        <p className="text-base text-slate-400 max-w-md leading-relaxed">
                            Notlarını ve hedeflerini saniyeler içinde interaktif testlere, flashcard'lara ve öğrenme yolculuklarına dönüştür.
                        </p>
                    </div>

                    {/* Animated Feature Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        {FEATURES.map((feature) => (
                            <div
                                key={feature.title}
                                className={`flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-sm ${feature.bg}`}
                                style={{
                                    animation: `float 6s ease-in-out infinite`,
                                    animationDelay: feature.delay,
                                }}
                            >
                                <div className={`mt-0.5 shrink-0 ${feature.color}`}>
                                    <feature.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">{feature.title}</p>
                                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel: Auth Form */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-24 relative overflow-y-auto">
                <div className="w-full max-w-[440px] space-y-8">
                    {/* Mobile Logo Only */}
                    <div className="md:hidden flex flex-col items-center justify-center space-y-4 mb-8 overflow-hidden">
                        <Image src="/logo.png" alt="Learnaxia Logo" width={64} height={64} className="w-16 h-16 object-contain drop-shadow-[0_0_10px_rgba(56,189,248,0.3)] shrink-0" />
                        <h1 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-500 uppercase truncate">
                            LEARNAXIA
                        </h1>
                    </div>

                    <Suspense fallback={<div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}>
                        <AuthForm />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}
