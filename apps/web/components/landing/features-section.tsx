"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    FileUp,
    BrainCircuit,
    Repeat,
    Layers,
    Camera,
    Compass,
    Activity,
    Check,
    Clock,
    Flame,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const WORKFLOW_STEPS = [
    {
        step: "01",
        icon: FileUp,
        title: "Ders Materyalini Yükle",
        description: "PDF slaytları, Word dokümanları veya kitap sayfalarının fotoğrafı. Hangi formatta olursa olsun saniyeler içinde işlenir.",
        tag: "Çoklu Format Desteği"
    },
    {
        step: "02",
        icon: BrainCircuit,
        title: "Odaklı Soru & Not Seti Üret",
        description: "Yapay zeka sayfalarca metni tarayarak sınavda çıkabilecek kritik kavramları, formülleri ve zıt anlamları soru setlerine çevirir.",
        tag: "Akıllı Analiz"
    },
    {
        step: "03",
        icon: Repeat,
        title: "Bilimsel Aralıklı Tekrarla Hatırla",
        description: "SM-2 algoritması her kartı ne kadar iyi hatırladığınıza göre puanlar. Zorlandığınız kartlar daha sık, oturanlar daha seyrek gelir.",
        tag: "Kalıcı Bellek (SM-2)"
    }
];

const CAPABILITIES = [
    {
        icon: Layers,
        badge: "Çalışma Modülü",
        title: "Çok Boyutlu Kart Atölyesi",
        desc: "Sadece klasik soru-cevap değil; çoktan seçmeli, boşluk doldurma ve doğru-yanlış formatlarıyla zihninizi farklı açılardan test edin.",
        highlight: "Flashcard • Çoktan Seçmeli • Boşluk Doldurma"
    },
    {
        icon: Camera,
        badge: "Görsel Zeka",
        title: "Fotoğraftan Soru Çözücü",
        desc: "Deneme sınavında veya kitapta takıldığınız zor bir sorunun fotoğrafını çekin. Adım adım açıklamalı çözümünü anında inceleyin.",
        highlight: "OCR + Detaylı Matematiksel/Kavramsal Çözüm"
    },
    {
        icon: Compass,
        badge: "Rehberli Öğrenme",
        title: "Kişisel Öğrenme Yolculukları",
        desc: "Yeni bir konuya başlarken nereden başlayacağınızı düşünmeyin. Konuyu yazın, yapay zeka size adım adım slayt rotası oluştursun.",
        highlight: "Bölüm Bölüm İlerleme • Özetler • Ara Sorular"
    },
    {
        icon: Activity,
        badge: "Gelişim Takibi",
        title: "Momentum & Performans Analitiği",
        desc: "Hangi konularda güçlüsünüz, nerede zorlanıyorsunuz? Günlük çalışma süreleri ve başarı grafikleriyle eksiklerinizi somut verilerle görün.",
        highlight: "Aktif Gün Serileri • Başarı Yüzdesi • Tier Sistemi"
    }
];

export function FeaturesSection() {
    return (
        <section id="how-it-works" className="py-20 md:py-32 relative bg-zinc-950 border-t border-zinc-900/80">
            {/* Subtle grid accent */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1820300a_1px,transparent_1px),linear-gradient(to_bottom,#1820300a_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

            <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-6xl">
                {/* Section 1: How It Works */}
                <div className="text-center max-w-2xl mx-auto mb-16 md:mb-24">
                    <span className="text-xs font-mono uppercase tracking-widest text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full">
                        Üç Adımda Çalışma Döngüsü
                    </span>
                    <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-100 tracking-tight">
                        Öğrenmek hiç bu kadar net ve sistematik olmamıştı.
                    </h2>
                    <p className="mt-4 text-zinc-400 text-sm sm:text-base leading-relaxed">
                        Saatlerce altını çizerek okumak yerine, hafızayı aktif geri çağırmaya (Active Recall) zorlayan bilimsel bir iş akışı.
                    </p>
                </div>

                {/* Workflow Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-24 md:mb-32">
                    {WORKFLOW_STEPS.map((step, idx) => (
                        <div
                            key={idx}
                            className="relative p-6 sm:p-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700/80 transition-all flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <span className="font-mono text-xs font-bold text-zinc-500 border border-zinc-800 px-2.5 py-1 rounded-md bg-zinc-900">
                                        ADIM {step.step}
                                    </span>
                                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                                        <step.icon className="w-5 h-5" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-zinc-100 mb-2">
                                    {step.title}
                                </h3>
                                <p className="text-sm text-zinc-400 leading-relaxed font-normal">
                                    {step.description}
                                </p>
                            </div>
                            <div className="mt-6 pt-4 border-t border-zinc-800/80 text-xs text-sky-400 font-medium">
                                ✓ {step.tag}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Section 2: Deep Capabilities */}
                <div id="features" className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-zinc-800/80 pb-8">
                        <div>
                            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">Platform Yetenekleri</span>
                            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-zinc-100 tracking-tight">
                                İhtiyacınız olan her araç tek bir ekosistemde.
                            </h2>
                        </div>
                        <p className="text-zinc-400 text-sm max-w-md">
                            Farklı platformlar arasında bölünmeyin. Not alma, soru üretimi, kamera çözümü ve hafıza tekrarı tek hesapta senkronize.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {CAPABILITIES.map((cap, idx) => (
                            <div
                                key={idx}
                                className="p-7 rounded-2xl border border-zinc-800/90 bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-zinc-700 transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-200">
                                            <cap.icon className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                                            {cap.badge}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-zinc-100 mb-2">
                                        {cap.title}
                                    </h3>
                                    <p className="text-sm text-zinc-400 leading-relaxed">
                                        {cap.desc}
                                    </p>
                                </div>
                                <div className="mt-6 pt-4 border-t border-zinc-800/60 text-xs font-mono text-zinc-400 flex items-center justify-between">
                                    <span>{cap.highlight}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 3: The Science Behind SM-2 */}
                <div id="methodology" className="mt-24 p-8 sm:p-12 rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900/60 to-zinc-950 relative overflow-hidden">
                    <div className="max-w-2xl relative z-10">
                        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                            Bilişsel Bilim & Algoritma
                        </span>
                        <h3 className="mt-4 text-2xl sm:text-3xl font-extrabold text-zinc-100">
                            Neden geleneksel çalışma unutulur da Aralıklı Tekrar kalıcıdır?
                        </h3>
                        <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed">
                            Hermann Ebbinghaus&apos;un unutma eğrisi araştırmasına göre, öğrenilen bilginin <strong>%70&apos;i ilk 24 saat içinde</strong> unutulur. 
                            Learnaxia&apos;nın entegre ettiği SM-2 algoritması, tam unutma anında kartı tekrar önünüze getirerek bellek izini güçlendirir ve zaman harcamadan kalıcı belleğe aktarır.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-4 text-xs font-mono text-zinc-300">
                            <span className="flex items-center gap-1.5 bg-zinc-800/80 px-3 py-1.5 rounded-lg border border-zinc-700/60">
                                <Clock className="w-3.5 h-3.5 text-sky-400" />
                                %60 Daha Az Zaman Harcama
                            </span>
                            <span className="flex items-center gap-1.5 bg-zinc-800/80 px-3 py-1.5 rounded-lg border border-zinc-700/60">
                                <Flame className="w-3.5 h-3.5 text-amber-400" />
                                3 Kat Daha Yüksek Sınav Hatırlama Oranı
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bottom Pre-CTA Callout */}
                <div className="mt-20 text-center flex flex-col items-center">
                    <h3 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-4">
                        Çalışma biçiminizi bugün dönüştürün.
                    </h3>
                    <p className="text-zinc-400 text-sm sm:text-base max-w-xl mb-8">
                        Hesabınızı saniyeler içinde oluşturun, ilk dökümanınızı yükleyin ve farkı bizzat görün.
                    </p>
                    <Button
                        size="lg"
                        className="h-12 px-8 text-base font-semibold bg-sky-500 hover:bg-sky-400 text-zinc-950 transition-all rounded-xl shadow-lg shadow-sky-500/20 active:scale-95"
                        asChild
                    >
                        <Link href="/login?tab=register">
                            Ücretsiz Kaydolun <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
