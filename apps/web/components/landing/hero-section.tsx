"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { InteractiveHeroDemo } from "@/components/landing/interactive-hero-demo";

export function HeroSection() {
    return (
        <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24 flex flex-col items-center">
            {/* Subtle Technical Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d0f_1px,transparent_1px),linear-gradient(to_bottom,#1f293d0f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

            {/* Soft Ambient Light (no harsh saturated neon) */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-sky-500/10 blur-[130px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center text-center">
                {/* Trust & Scientific Method Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 text-zinc-300 text-xs font-medium mb-6 backdrop-blur-sm"
                >
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-zinc-200">Bilişsel Bilim & SM-2 Algoritması Destekli Öğrenme</span>
                </motion.div>

                {/* Primary Headline: Clean, Punchy, High-Contrast */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05 }}
                    className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-zinc-100 max-w-4xl text-center leading-[1.08]"
                >
                    Sınavlara saatlerce ezberle değil,{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
                        bilimsel akılla
                    </span>{" "}
                    hazırlanın.
                </motion.h1>

                {/* Human, Empathic Copy */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.12 }}
                    className="mt-6 text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl text-center leading-relaxed font-normal"
                >
                    Ders notlarınızı, PDF&apos;lerinizi ve zorlandığınız soruları saniyeler içinde odaklı çalışma kartlarına dönüştürün.
                    Hafıza eğrinize göre planlanan aralıklı tekrarlarla zamanınızı en verimli şekilde kullanın.
                </motion.p>

                {/* CTA Action Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full justify-center"
                >
                    <Button
                        size="lg"
                        className="h-12 px-7 text-base font-semibold bg-sky-500 hover:bg-sky-400 text-zinc-950 transition-all rounded-xl shadow-lg shadow-sky-500/20 active:scale-95"
                        asChild
                    >
                        <Link href="/login?tab=register">
                            Ücretsiz Başlayın <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        className="h-12 px-7 text-base font-medium border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl active:scale-95"
                        asChild
                    >
                        <Link href="#how-it-works">
                            Nasıl Çalışır?
                        </Link>
                    </Button>
                </motion.div>

                {/* Micro Trust Indicators */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.28 }}
                    className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-500"
                >
                    <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
                        Kredi kartı gerekmez
                    </span>
                    <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
                        Web ve Mobil tam senkron
                    </span>
                    <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
                        Anında kullanmaya başlayın
                    </span>
                </motion.div>

                {/* Interactive Live Product Simulator (Replaces fake AI mockup) */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.35 }}
                    className="w-full"
                >
                    <InteractiveHeroDemo />
                </motion.div>
            </div>
        </section>
    );
}
