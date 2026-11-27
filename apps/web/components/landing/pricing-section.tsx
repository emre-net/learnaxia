"use client";

import Link from "next/link";
import { Check, Coins, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { TOKEN_CONFIG } from "@learnaxia/shared";

const pillars = [
    {
        name: "Öğrenme & Üretim",
        badge: "Sonsuza Kadar Ücretsiz",
        title: "₺0",
        subtitle: "abonelik yok",
        description: "Tüm temel çalışma, not alma ve tekrar araçları hiçbir duvar olmadan herkese açık.",
        features: [
            "Sınırsız manuel modül, flashcard ve test oluşturma",
            "Bilimsel SM-2 aralıklı tekrar ve kaydırma modu",
            "Hibrit BlockNote notları ve sonsuz vektörel el çizimi",
            "Sınırsız koleksiyon, keşfet ve çevrimdışı çalışma",
            "Tam Web ve Android/iOS senkronizasyonu"
        ],
        cta: "Ücretsiz Başla",
        href: "/login?tab=register",
        highlighted: false
    },
    {
        name: "AI Jeton Ekonomisi",
        badge: "Kendi Kendini Sürdüren AI",
        title: `${TOKEN_CONFIG.DAILY_FREE_TOKENS} Jeton`,
        subtitle: "her gün ücretsiz yenilenir",
        description: "AI sunucu maliyetlerini ücretli abonelik satmadan adil günlük kota ve isteğe bağlı ödüllü reklamla karşılıyoruz.",
        features: [
            `Her gün reklamsız ${TOKEN_CONFIG.DAILY_FREE_TOKENS} ücretsiz AI jetonu`,
            `AI Modül (${TOKEN_CONFIG.COSTS.AI_MODULE}), AI Not (${TOKEN_CONFIG.COSTS.AI_NOTE}) ve Foto Çözüm (${TOKEN_CONFIG.COSTS.AI_PHOTO_SOLVE})`,
            `İsterseniz mobilde kısa ödüllü reklamla +${TOKEN_CONFIG.REWARDED_AD_BONUS} bonus jeton`,
            "Zorunlu reklam, abonelik veya kredi kartı kesinlikle yok",
            "Kazanılan bonus jetonlar Web ve Mobil tek cüzdanda geçerli"
        ],
        cta: "Hemen Deneyin",
        href: "/login?tab=register",
        highlighted: true
    }
];

export function PricingSection() {
    return (
        <section id="pricing" className="py-24 bg-[#09090b] relative overflow-hidden">
            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-4">
                        <Coins className="h-3.5 w-3.5" />
                        <span>Abonesiz & Açık Eğitim Modeli</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight sm:text-5xl mb-4 text-zinc-100">
                        Herkes İçin Ücretsiz, Sürdürülebilir AI
                    </h2>
                    <p className="text-zinc-400 md:text-lg max-w-[780px] mx-auto">
                        Eğitimi ücretli duvarların arkasına koymuyoruz. Çalışma ve tekrar araçları tamamen ücretsizdir; AI üretimleri günlük ücretsiz jetonlarla ve dilersen mobilde ödüllü reklamla desteklenir.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {pillars.map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.97 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: idx * 0.08 }}
                            viewport={{ once: true }}
                            className={`relative flex flex-col p-8 rounded-3xl border ${
                                item.highlighted
                                    ? "border-sky-500/40 bg-[#121215] shadow-2xl shadow-sky-500/5"
                                    : "border-zinc-800 bg-[#121215]"
                            }`}
                        >
                            <div className="inline-flex self-start items-center gap-1.5 py-1 px-3 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-5">
                                <Sparkles className="h-3 w-3" />
                                <span>{item.badge}</span>
                            </div>

                            <div className="mb-7">
                                <h3 className="text-2xl font-bold text-zinc-100 mb-2">{item.name}</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-zinc-100">{item.title}</span>
                                    <span className="text-zinc-400 text-sm">/ {item.subtitle}</span>
                                </div>
                                <p className="text-zinc-400 text-sm mt-3 leading-relaxed">{item.description}</p>
                            </div>

                            <ul className="space-y-3.5 mb-8 flex-1">
                                {item.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-200">
                                        <div className="mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0 bg-sky-500/15 text-sky-400">
                                            <Check className="h-3 w-3" />
                                        </div>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                size="lg"
                                variant={item.highlighted ? "default" : "outline"}
                                className={`w-full h-12 rounded-2xl font-bold transition-all active:scale-95 ${
                                    item.highlighted
                                        ? "bg-sky-500 hover:bg-sky-400 text-zinc-950"
                                        : "border-zinc-700 bg-[#18181b] hover:bg-zinc-800 text-zinc-100"
                                }`}
                                asChild
                            >
                                <Link href={item.href}>{item.cta}</Link>
                            </Button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
