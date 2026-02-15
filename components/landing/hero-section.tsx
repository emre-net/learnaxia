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

            <div className="container px-4 md:px-6 relative z-10 flex flex-col items-center text-center">
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
                    className="text-4xl font-extrabold tracking-tight lg:text-7xl mb-6 bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-400 bg-clip-text text-transparent pb-2"
                >
                    Yargılamaz, <br className="hidden md:block" /> Sadece İlerletir.
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="max-w-[700px] text-muted-foreground md:text-xl mb-8"
                >
                    Kişiselleştirilmiş yapay zeka deneyimi ile öğrenme sürecini hızlandır.
                    Jeton kazan, kendini geliştir ve sınırlarını zorla.
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
                    className="mt-16 relative w-full max-w-5xl aspect-video rounded-xl border bg-background/50 shadow-2xl overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-blue-500/10" />
                    <div className="flex items-center justify-center h-full text-muted-foreground/30 font-bold text-4xl select-none">
                        UI Preview Placeholder
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
