import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { AuthForm } from "@/components/auth/auth-form"
import { BrainCircuit, Sparkles, Zap } from "lucide-react"

export const metadata: Metadata = {
    title: "Giriş Yap | Learnaxia",
    description: "Hesabına giriş yap veya yeni kayıt oluştur.",
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-background">
            {/* Left Panel: Branding & Ambient Art */}
            <div className="hidden md:flex flex-1 relative bg-slate-950 overflow-hidden flex-col justify-between p-12">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-purple-900/40 to-slate-950 z-0"></div>
                
                {/* Abstract glowing shapes */}
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/30 blur-[120px] rounded-full pointer-events-none z-0" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/30 blur-[120px] rounded-full pointer-events-none z-0" />

                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-3">
                        <Image src="/logo.png" alt="Learnaxia Logo" width={80} height={80} className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(56,189,248,0.3)]" />
                        <span className="text-4xl font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-500 uppercase">
                            LEARNAXIA
                        </span>
                    </Link>
                </div>

                <div className="relative z-10 space-y-8 mt-auto mb-10">
                    <h1 className="text-4xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
                        Öğrenme yolculuğuna<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                            yapay zeka
                        </span> ile yön ver.
                    </h1>
                    <p className="text-lg text-slate-300 max-w-md leading-relaxed">
                        Dokümanlarınızı, notlarınızı ve hedeflerinizi saniyeler içinde interaktif testlere, flashcardlara ve öğrenme yolculuklarına dönüştürün.
                    </p>
                    <div className="flex gap-4 pt-4">
                        <div className="flex items-center gap-2 text-sm text-slate-400 font-medium bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
                            <BrainCircuit className="w-4 h-4 text-purple-400" />
                            <span>Akıllı Tekrar Sistemi</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400 font-medium bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
                            <Zap className="w-4 h-4 text-amber-400" />
                            <span>Hızlı Öğrenme</span>
                        </div>
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
                    
                    <AuthForm />
                </div>
            </div>
        </div>
    )
}
