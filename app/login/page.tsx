import { Metadata } from "next"
import Link from "next/link"
import { BrainCircuit } from "lucide-react"
import { AuthForm } from "@/components/auth/auth-form"

export const metadata: Metadata = {
    title: "Giriş Yap | Learnaxia",
    description: "Hesabına giriş yap veya yeni kayıt oluştur.",
}

export default function LoginPage() {
    return (
        <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex overflow-hidden">
                <div className="absolute inset-0 bg-zinc-900" />

                {/* Animated Background Elements */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-10 left-10 h-72 w-72 rounded-full bg-purple-500/30 blur-3xl animate-pulse" />
                    <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl animate-pulse delay-1000" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl animate-pulse delay-700" />
                </div>

                {/* Neural Network Visualization (CSS + Icons) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                    <div className="relative w-[500px] h-[500px]">
                        {/* Central Hub */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <BrainCircuit className="h-32 w-32 text-indigo-400 animate-pulse" />
                        </div>

                        {/* Orbiting Elements */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 animate-[spin_10s_linear_infinite]">
                            <div className="h-4 w-4 rounded-full bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.5)]" />
                        </div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 animate-[spin_15s_linear_infinite_reverse]">
                            <div className="h-3 w-3 rounded-full bg-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.5)]" />
                        </div>
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 animate-[bounce_8s_infinite]">
                            <div className="h-2 w-2 rounded-full bg-white/50" />
                        </div>

                        {/* Connecting Lines (SVG overlay could be better but keeping it simple) */}
                        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.2" className="text-indigo-500 animate-[spin_20s_linear_infinite]" />
                            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.2" className="text-purple-500 animate-[spin_15s_linear_infinite_reverse]" />
                        </svg>
                    </div>
                </div>

                <div className="relative z-20 flex items-center text-lg font-medium">
                    <BrainCircuit className="mr-2 h-6 w-6 text-indigo-400" />
                    Learnaxia <span className="ml-2 text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">Beta</span>
                </div>
                <div className="relative z-20 mt-auto">
                    <blockquote className="space-y-2 border-l-4 border-indigo-500 pl-4 py-1">
                        <p className="text-lg italic text-zinc-100">
                            &ldquo;Öğrenmek, akıntıya karşı kürek çekmek gibidir; durduğunuz an geriye gidersiniz.&rdquo;
                        </p>
                        <footer className="text-sm text-indigo-300 font-semibold">– Konfüçyüs</footer>
                    </blockquote>
                </div>
            </div>
            <div className="lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
                    <AuthForm />
                    <p className="px-8 text-center text-sm text-muted-foreground">
                        Devam ederek <Link href="/terms" className="underline underline-offset-4 hover:text-primary">Kullanım Şartları</Link> ve <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">Gizlilik Politikası</Link>'nı kabul etmiş olursun.
                    </p>
                </div>
            </div>
        </div>
    )
}
