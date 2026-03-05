"use client";

import { motion } from "framer-motion";
import {
    BrainCircuit,
    Zap,
    BarChart3,
    FileText,
    Camera,
    FolderPlus,
    Sparkles,
    Cpu,
    Target
} from "lucide-react";

const features = [
    {
        icon: BrainCircuit,
        title: "Modül Atölyesi",
        description: "AI veya manuel yöntemlerle saniyeler içinde flashcard, test ve boşluk doldurma soruları üretin.",
        color: "text-blue-500",
        bg: "bg-blue-500/10"
    },
    {
        icon: Cpu,
        title: "Not Atölyesi",
        description: "PDF dokümanlarınızı yükleyin, AI sizin için en önemli yerleri analiz edip akıllı notlara dönüştürsün.",
        color: "text-purple-500",
        bg: "bg-purple-500/10"
    },
    {
        icon: Camera,
        title: "Soru Çözücü",
        description: "Kitaplardaki zor soruların fotoğrafını çekin, AI adım adım ve anlaşılır çözümünü anında sunsun.",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10"
    },
    {
        icon: Zap,
        title: "Bilimsel Tekrar",
        description: "SM-2 algoritması ile bilgileri unutma eğrinize göre tekrar edin, kalıcı hafızaya aktarın.",
        color: "text-amber-500",
        bg: "bg-amber-500/10"
    },
    {
        icon: FolderPlus,
        title: "Koleksiyonlar",
        description: "Modülleri tematik setler altında birleştirin, düzenli ve stratejik bir çalışma müfredatı kurun.",
        color: "text-indigo-500",
        bg: "bg-indigo-500/10"
    },
    {
        icon: Target,
        title: "Gelişim Analizi",
        description: "Hangi konularda eksik olduğunuzu yapay zeka ile tespit edin, çalışma rotanızı buna göre güncelleyin.",
        color: "text-zinc-400",
        bg: "bg-zinc-500/10"
    }
];

export function FeaturesSection() {
    return (
        <section id="features" className="py-24 bg-slate-950/50 border-t border-slate-900 overflow-hidden">
            <div className="container mx-auto px-4 md:px-6 relative">
                {/* Decorative background glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

                <div className="text-center mb-20 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-4"
                    >
                        <Sparkles className="h-3 w-3" /> Akıllı Atölye Ekosistemi
                    </motion.div>
                    <h2 className="text-4xl font-black tracking-tighter md:text-6xl mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                        Öğrenmenin En Verimli Hali
                    </h2>
                    <p className="text-slate-400 md:text-xl max-w-[800px] mx-auto leading-relaxed font-medium">
                        Learnaxia, karmaşık konuları parçalara böler, yapay zeka ile analiz eder ve
                        bilimsel yöntemlerle kalıcı hafızanıza aktarmanıza yardımcı olur.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            viewport={{ once: true }}
                            className="bg-slate-900/40 backdrop-blur-sm rounded-[2.5rem] p-8 border border-slate-800 hover:border-slate-700/50 hover:bg-slate-900/60 transition-all group relative overflow-hidden active:scale-[0.98]"
                        >
                            <div className={`absolute -bottom-4 -right-4 p-3 opacity-5 group-hover:opacity-10 transition-opacity`}>
                                <feature.icon className={`h-32 w-32 ${feature.color}`} />
                            </div>

                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${feature.bg} ${feature.color} border border-current opacity-80 group-hover:opacity-100 transition-opacity`}>
                                <feature.icon className="h-7 w-7" />
                            </div>
                            <h3 className="text-2xl font-black mb-3 text-white group-hover:text-blue-400 transition-colors">{feature.title}</h3>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed mb-4">{feature.description}</p>

                            <div className="flex items-center text-[10px] font-bold text-slate-500 group-hover:text-blue-400 transition-all uppercase tracking-widest gap-2">
                                Detayları Gör <Sparkles className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
