"use client";

import { motion } from "framer-motion";
import { BrainCircuit, Zap, BarChart3, Coins } from "lucide-react";

const features = [
    {
        icon: BrainCircuit,
        title: "Yapay Zeka Asistanı",
        description: "PDF notlarını yükle veya sadece bir konu söyle. Saniyeler içinde flashcard, test ve boşluk doldurma soruların hazır.",
        color: "text-purple-500",
        bg: "bg-purple-500/10"
    },
    {
        icon: Zap,
        title: "Spaced Repetition",
        description: "Bilimsel aralıklı tekrar algoritması (SM-2) ile bilgileri uzun süreli hafızana aktar. Unutmaya son.",
        color: "text-blue-500",
        bg: "bg-blue-500/10"
    },
    {
        icon: BarChart3,
        title: "Detaylı Analiz",
        description: "Hangi konularda iyisin, hangilerinde zorlanıyorsun? Gelişimini grafiklerle takip et.",
        color: "text-green-500",
        bg: "bg-green-500/10"
    },
    {
        icon: Coins,
        title: "Jeton Ekonomisi",
        description: "Öğrendikçe jeton kazan. Yapay zeka özelliklerini kullanmak için biriktir.",
        color: "text-yellow-500",
        bg: "bg-yellow-500/10"
    }
];

export function FeaturesSection() {
    return (
        <section id="features" className="py-20 bg-muted/30">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-black tracking-tighter md:text-6xl mb-4">Öğrenmenin En Verimli Hali</h2>
                    <p className="text-muted-foreground md:text-xl max-w-[900px] mx-auto leading-relaxed">
                        Learnaxia, karmaşık konuları parçalara böler, yapay zeka ile analiz eder ve
                        bilimsel yöntemlerle kalıcı hafızanıza aktarmanıza yardımcı olur.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            viewport={{ once: true }}
                            className="bg-background rounded-2xl p-6 border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                        >
                            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity`}>
                                <feature.icon className={`h-24 w-24 ${feature.color}`} />
                            </div>

                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${feature.bg} ${feature.color}`}>
                                <feature.icon className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                            <p className="text-muted-foreground text-sm">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
