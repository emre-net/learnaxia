"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
    return (
        <section className="relative overflow-hidden pt-32 pb-16 md:pt-48 md:pb-32">
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
                    Yargılamaz, <br className="hidden md:block" /> Sadece İlerletir.
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

                {/* Mock UI Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.5 }}
                    className="mt-16 relative w-full max-w-5xl aspect-[16/10] md:aspect-video rounded-3xl border-4 border-slate-800 bg-slate-900/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-blue-500/5" />

                    {/* Mock UI Content */}
                    <div className="absolute inset-0 flex flex-col p-4 md:p-8">
                        {/* Mock Header */}
                        <div className="flex items-center justify-between mb-8 opacity-60">
                            <div className="flex items-center gap-4">
                                <div className="h-8 w-8 rounded-lg bg-slate-800 animate-pulse" />
                                <div className="h-4 w-32 rounded bg-slate-800 animate-pulse" />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-slate-800 animate-pulse" />
                                <div className="h-8 w-24 rounded-full bg-blue-600/20 animate-pulse" />
                            </div>
                        </div>

                        {/* Mock Grid */}
                        <div className="grid grid-cols-12 gap-6 flex-1">
                            {/* Left Col - Sidebar Mock */}
                            <div className="col-span-3 space-y-4 hidden md:block opacity-40">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-10 w-full rounded-xl bg-slate-800/50" />
                                ))}
                            </div>

                            {/* Main Content Mock */}
                            <div className="col-span-12 md:col-span-9 space-y-6">
                                <div className="h-32 w-full rounded-3xl bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-white/5 backdrop-blur-sm flex items-center px-8">
                                    <div className="space-y-2">
                                        <div className="h-2 w-48 rounded bg-white/20" />
                                        <div className="h-5 w-64 rounded bg-white/40" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-48 rounded-3xl bg-slate-800/30 border border-white/5 p-6 space-y-4">
                                            <div className="h-10 w-10 rounded-2xl bg-slate-700/50" />
                                            <div className="space-y-2">
                                                <div className="h-3 w-full rounded bg-slate-700/50" />
                                                <div className="h-3 w-2/3 rounded bg-slate-700/50" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Floating Glows */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/20 blur-[80px] rounded-full group-hover:bg-purple-500/30 transition-colors duration-700" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full group-hover:bg-blue-500/30 transition-colors duration-700" />
                </motion.div>
            </div>
        </section>
    );
}
