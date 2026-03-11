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
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#020813] relative overflow-hidden">
            {/* Highly Vibrant Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-20%] w-[70%] h-[70%] bg-blue-600/20 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[50%] bg-cyan-500/15 blur-[150px] rounded-full pointer-events-none" />

            {/* Header / Logo Section */}
            <div className="z-10 text-center mb-10 mt-[-5%]">
                <h1 className="text-4xl md:text-[54px] font-black tracking-[0.25em] bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]">
                    LEARNAXIA
                </h1>
            </div>

            {/* Auth Form Card */}
            <div className="z-10 w-full max-w-[420px] px-5 text-left transition-all duration-300">
                <AuthForm />
            </div>
        </div>
    )
}
