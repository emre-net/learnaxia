import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Suspense } from "react"
import { AuthForm } from "@/components/auth/auth-form"
import { BrainCircuit, Zap, CheckCircle2, ShieldCheck, Clock } from "lucide-react"

export const metadata: Metadata = {
    title: "Giriş Yap & Kayıt Ol | Learnaxia",
    description: "Learnaxia hesabınıza giriş yapın veya yeni bir hesap oluşturun.",
}

const HIGHLIGHTS = [
    {
        icon: BrainCircuit,
        title: "SM-2 Aralıklı Tekrar",
        desc: "Hafıza eğrisine göre optimize edilmiş kart tekrarları",
    },
    {
        icon: Zap,
        title: "Hızlı İçerik Üretimi",
        desc: "PDF ve notlardan saniyeler içinde çalışma kartları",
    },
    {
        icon: CheckCircle2,
        title: "Ölçülebilir İlerleme",
        desc: "Çalışma süresi, doğruluk oranı ve momentum analitiği",
    },
]

export default function LoginPage() {
    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-zinc-950 text-zinc-100 antialiased selection:bg-sky-500/20">
            {/* Left Panel: Curated Product Narrative */}
            <div className="hidden md:flex flex-1 relative bg-zinc-900/40 border-r border-zinc-800/80 overflow-hidden flex-col justify-between p-12 lg:p-16">
                {/* Subtle Grid Accent */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d0f_1px,transparent_1px),linear-gradient(to_bottom,#1f293d0f_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

                {/* Brand Logo & Name */}
                <div className="relative z-10">
                    <Link href="/" className="inline-flex items-center gap-3 group">
                        <Image
                            src="/logo.png"
                            alt="Learnaxia Logo"
                            width={36}
                            height={36}
                            className="w-9 h-9 object-contain shrink-0 transition-transform group-hover:scale-105"
                        />
                        <span className="text-xl font-bold tracking-tight text-zinc-100 group-hover:text-white transition-colors">
                            Learnaxia
                        </span>
                    </Link>
                </div>

                {/* Central Value Statement */}
                <div className="relative z-10 max-w-lg space-y-8 my-auto py-12">
                    <div className="space-y-4">
                        <span className="text-xs font-mono uppercase tracking-widest text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full inline-block">
                            Bilişsel Bilim Destekli Öğrenme
                        </span>
                        <h1 className="text-3xl lg:text-4xl font-extrabold text-zinc-100 tracking-tight leading-tight">
                            Ezber yükünü bırakın,{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
                                akılcı tekrarlarla
                            </span>{" "}
                            uzmanlaşın.
                        </h1>
                        <p className="text-sm text-zinc-400 leading-relaxed font-normal">
                            Notlarınızı, PDF&apos;lerinizi ve ders slaytlarınızı saniyeler içinde zenginleştirilmiş çalışma setlerine dönüştürün.
                        </p>
                    </div>

                    {/* Features List */}
                    <div className="space-y-3 pt-2">
                        {HIGHLIGHTS.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-start gap-3.5 p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60"
                            >
                                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
                                    <item.icon className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-zinc-200">{item.title}</p>
                                    <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Trust Quote */}
                <div className="relative z-10 pt-6 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Güvenli ve şifreli veri saklama
                    </span>
                    <span className="font-mono text-[11px]">v2.4 Production</span>
                </div>
            </div>

            {/* Right Panel: Auth Form */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-16 relative">
                <div className="w-full max-w-[420px] space-y-6">
                    {/* Mobile Logo Only */}
                    <div className="md:hidden flex flex-col items-center justify-center space-y-2 mb-6">
                        <Image
                            src="/logo.png"
                            alt="Learnaxia Logo"
                            width={48}
                            height={48}
                            className="w-12 h-12 object-contain"
                        />
                        <span className="text-xl font-bold tracking-tight text-zinc-100">
                            Learnaxia
                        </span>
                    </div>

                    <Suspense fallback={<div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>}>
                        <AuthForm />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}
