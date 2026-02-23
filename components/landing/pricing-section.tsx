"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const tiers = [
    {
        name: "Ücretsiz",
        price: "0",
        description: "Öğrenmeye başlamak isteyenler için ideal.",
        features: [
            "Sınırsız manuel kart oluşturma",
            "Günlük 3 AI modül oluşturma",
            "Temel analiz grafikleri",
            "50 Hoşgeldin Jetonu",
            "Spaced Repetition algoritması"
        ],
        cta: "Hemen Başla",
        popular: false
    },
    {
        name: "Pro",
        price: "99",
        description: "Hızını artırmak ve sınırları zorlamak isteyenler için.",
        features: [
            "Her şey Ücretsiz'de dahil",
            "Sınırsız AI modül oluşturma",
            "Gelişmiş bilişsel analizler",
            "Aylık 1000 Bonus Jeton",
            "PDF ve Doküman Analizi",
            "Öncelikli Destek"
        ],
        cta: "Pro'ya Geç",
        popular: true
    }
];

export function PricingSection() {
    return (
        <section id="pricing" className="py-24 bg-background relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-black tracking-tighter sm:text-5xl mb-4">
                        Basit ve Şeffaf Fiyatlandırma
                    </h2>
                    <p className="text-muted-foreground md:text-xl max-w-[800px] mx-auto">
                        Learnaxia'nın tüm gücünü ücretsiz deneyimleyin veya gelişmiş özelliklerle öğrenme hızınızı ikiye katlayın.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {tiers.map((tier, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            viewport={{ once: true }}
                            className={`relative flex flex-col p-8 rounded-[2.5rem] border-2 ${tier.popular ? 'border-primary shadow-2xl shadow-primary/10 bg-primary/5' : 'border-border bg-muted/30'}`}
                        >
                            {tier.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 py-1 px-4 bg-primary text-primary-foreground text-xs font-black rounded-full uppercase tracking-widest">
                                    En Popüler
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-2xl font-black mb-2">{tier.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black">₺{tier.price}</span>
                                    <span className="text-muted-foreground text-sm">/aylık</span>
                                </div>
                                <p className="text-muted-foreground text-sm mt-4">{tier.description}</p>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {tier.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm">
                                        <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${tier.popular ? 'bg-primary/20 text-primary' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                                            <Check className="h-3 w-3" />
                                        </div>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                size="lg"
                                variant={tier.popular ? "default" : "outline"}
                                className={`w-full h-12 rounded-2xl font-black transition-all active:scale-95 ${tier.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                            >
                                {tier.cta}
                            </Button>
                        </motion.div>
                    ))}
                </div>

                <p className="text-center text-sm text-muted-foreground mt-12 italic">
                    * Jetonlar, yapay zeka özelliklerini (flashcard üretimi, analiz) kullanmak için gereklidir.
                </p>
            </div>
        </section>
    );
}
