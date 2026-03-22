"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
    return (
        <section className="relative overflow-hidden pt-32 pb-8 md:pt-48 md:pb-16">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-1/2 h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 mb-6"
                >
                    <Sparkles className="mr-1 h-3 w-3 text-purple-500" />
                    <span>Now with AI Document Analysis</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-4xl font-black tracking-tight lg:text-8xl mb-6 bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-400 bg-clip-text text-transparent pb-2 leading-tight"
                >
                    Öğrenme Yolculuğunuzu <br className="hidden md:block" /> Yapay Zeka ile Kişiselleştirin.
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="max-w-[800px] text-muted-foreground md:text-xl mb-10 leading-relaxed"
                >
                    Learnaxia, öğrenme sürecini kişiselleştirilmiş yapay zeka ile hızlandıran yeni nesil bir platformdur.
                    Notlarını yükle, AI ile saniyeler içinde çalışma setlerini oluştur ve Spaced Repetition ile asla unutma.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 w-full justify-center"
                >
                    <Button size="lg" className="h-12 px-8 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-purple-500/25" asChild>
                        <Link href="/dashboard">
                            Hemen Başla <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    <Button variant="outline" size="lg" className="h-12 px-8 text-lg" asChild>
                        <Link href="#features">
                            Nasıl Çalışır?
                        </Link>
                    </Button>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.5 }}
                    className="mt-12 relative w-full max-w-5xl aspect-[16/10] rounded-3xl border border-slate-800 bg-slate-900/50 shadow-2xl overflow-hidden"
                >
                    <Image
                        src="/learnaxia_dashboard_preview_v2_1774093947505.png"
                        alt="Learnaxia Dashboard Preview"
                        fill
                        className="object-cover opacity-90 transition-opacity"
                        sizes="(max-width: 1280px) 100vw, 1280px"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none" />
                </motion.div>
            </div>
        </section>
    );
}
