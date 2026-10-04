"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    RotateCw,
    CheckCircle2,
    Calendar,
    Brain,
    FileText,
    Camera,
    TrendingUp,
    ChevronRight,
    BookOpen
} from "lucide-react";

interface SampleCard {
    category: string;
    topic: string;
    question: string;
    answer: string;
    keyPoints: string[];
    difficulty: string;
}

const SAMPLE_CARDS: SampleCard[] = [
    {
        category: "Tıp & Farmakoloji",
        topic: "Otonom Sinir Sistemi",
        question: "Beta-1 adrenerjik reseptör agonistlerinin kalp üzerindeki birincil fizyolojik etkileri nelerdir?",
        answer: "SA düğümünde otomatisiteyi, AV düğümde iletim hızını ve ventriküler miyokardda kasılma gücünü (pozitif inotrop ve kronotrop etki) artırır.",
        keyPoints: ["Pozitif Kronotropi (Nabız artışı)", "Pozitif İnotropi (Kasılma gücü)", "Pozitif Dromotropi (İletim hızı)"],
        difficulty: "Orta"
    },
    {
        category: "Hukuk & Mevzuat",
        topic: "Medeni Hukuk / Hak Ehliyeti",
        question: "Türk Medeni Kanunu'na göre hak ehliyeti ne zaman başlar ve hangi şartlara bağlıdır?",
        answer: "Hak ehliyeti, çocuğun sağ olarak tamamıyla doğduğu andan itibaren başlar; ancak çocuk sağ doğmak koşuluyla ana rahmine düştüğü andan itibaren hak ehliyetine sahiptir.",
        keyPoints: ["Tam ve sağ doğum kuralı", "Cenin dönemi şartlı koruma", "TMK Madde 28"],
        difficulty: "Temel"
    },
    {
        category: "Yazılım & Mimari",
        topic: "Dağıtık Sistemler",
        question: "CAP Teoremi'ne göre ağ bölümlenmesi (Network Partition) anında neden Consistency ve Availability aynı anda sağlanamaz?",
        answer: "İki düğüm arasındaki bağlantı koptuğunda, sisteme gelen bir yazma isteği ya reddedilmelidir (Availability feda edilir) ya da kabul edilip diğer düğümle tutarsız kalmalıdır (Consistency feda edilir).",
        keyPoints: ["P (Partition Tolerance) kaçınılmazdır", "CP: Tutarlılık öncelikli", "AP: Erişilebilirlik öncelikli"],
        difficulty: "İleri"
    }
];

export function InteractiveHeroDemo() {
    const [activeTab, setActiveTab] = useState<"flashcard" | "extractor" | "solver">("flashcard");
    const [cardIndex, setCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sm2Schedule, setSm2Schedule] = useState<{ quality: number; days: number } | null>(null);

    const currentCard = SAMPLE_CARDS[cardIndex];

    const handleRating = (quality: number, days: number) => {
        setSm2Schedule({ quality, days });
        setTimeout(() => {
            setIsFlipped(false);
            setSm2Schedule(null);
            setCardIndex((prev) => (prev + 1) % SAMPLE_CARDS.length);
        }, 1200);
    };

    return (
        <div className="w-full max-w-4xl mx-auto mt-12 rounded-2xl border border-zinc-800 bg-zinc-950/90 shadow-2xl backdrop-blur-xl overflow-hidden">
            {/* Top Toolbar */}
            <div className="px-4 sm:px-6 py-3 border-b border-zinc-800/80 bg-zinc-900/40 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="text-xs font-mono text-zinc-500 ml-2 hidden sm:inline">learnaxia.com/study-preview</span>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center gap-1 p-1 bg-zinc-900/90 rounded-lg border border-zinc-800 text-xs">
                    <button
                        onClick={() => setActiveTab("flashcard")}
                        className={`px-3 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                            activeTab === "flashcard"
                                ? "bg-zinc-800 text-white shadow-sm"
                                : "text-zinc-400 hover:text-zinc-200"
                        }`}
                    >
                        <Brain className="w-3.5 h-3.5 text-sky-400" />
                        <span>Aralıklı Tekrar (SM-2)</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("extractor")}
                        className={`px-3 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                            activeTab === "extractor"
                                ? "bg-zinc-800 text-white shadow-sm"
                                : "text-zinc-400 hover:text-zinc-200"
                        }`}
                    >
                        <FileText className="w-3.5 h-3.5 text-purple-400" />
                        <span>PDF Analizi</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("solver")}
                        className={`px-3 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                            activeTab === "solver"
                                ? "bg-zinc-800 text-white shadow-sm"
                                : "text-zinc-400 hover:text-zinc-200"
                        }`}
                    >
                        <Camera className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Soru Çözücü</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-6 sm:p-8 min-h-[380px] flex flex-col justify-between">
                {activeTab === "flashcard" && (
                    <div className="space-y-6">
                        {/* Meta Header */}
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">
                                    {currentCard.category}
                                </span>
                                <span className="text-zinc-500">•</span>
                                <span className="text-zinc-400 font-mono">{currentCard.topic}</span>
                            </div>
                            <span className="text-zinc-500 font-mono">
                                Kart {cardIndex + 1} / {SAMPLE_CARDS.length}
                            </span>
                        </div>

                        {/* Interactive Card Surface */}
                        <div
                            onClick={() => !sm2Schedule && setIsFlipped(!isFlipped)}
                            className="relative min-h-[190px] p-6 rounded-xl border border-zinc-800/90 bg-zinc-900/60 hover:border-zinc-700/80 cursor-pointer transition-all flex flex-col justify-between group"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-3 text-xs text-zinc-500">
                                    <span className="uppercase tracking-wider font-semibold">
                                        {isFlipped ? "Cevap & Açıklama" : "Soru / Kavram"}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-zinc-400 group-hover:text-sky-400 transition-colors">
                                        <RotateCw className="w-3 h-3" />
                                        {isFlipped ? "Ön yüze dön" : "Kartı çevir"}
                                    </span>
                                </div>

                                <AnimatePresence mode="wait">
                                    {!isFlipped ? (
                                        <motion.div
                                            key="front"
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -6 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <p className="text-base sm:text-lg font-medium text-zinc-100 leading-relaxed">
                                                {currentCard.question}
                                            </p>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="back"
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -6 }}
                                            transition={{ duration: 0.2 }}
                                            className="space-y-3"
                                        >
                                            <p className="text-sm sm:text-base text-zinc-200 leading-relaxed">
                                                {currentCard.answer}
                                            </p>
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {currentCard.keyPoints.map((point, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-2 py-0.5 rounded text-[11px] bg-zinc-800/80 text-zinc-300 border border-zinc-700/50"
                                                    >
                                                        ✓ {point}
                                                    </span>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
                                <span>Zorluk Seviyesi: <strong className="text-zinc-300">{currentCard.difficulty}</strong></span>
                                <span className="text-[11px] text-zinc-500">Tıklayarak çevirin</span>
                            </div>
                        </div>

                        {/* SM-2 Feedback Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                            <span className="text-xs text-zinc-400">
                                {isFlipped ? "Hatırlama durumunuzu seçin:" : "Cevabı gördükten sonra aralığı belirleyin:"}
                            </span>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleRating(1, 1)}
                                    disabled={!isFlipped || !!sm2Schedule}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                        !isFlipped
                                            ? "opacity-40 cursor-not-allowed border-zinc-800 text-zinc-500"
                                            : "border-rose-900/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 active:scale-95"
                                    }`}
                                >
                                    Zorlandı (1 gün)
                                </button>
                                <button
                                    onClick={() => handleRating(3, 4)}
                                    disabled={!isFlipped || !!sm2Schedule}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                        !isFlipped
                                            ? "opacity-40 cursor-not-allowed border-zinc-800 text-zinc-500"
                                            : "border-amber-900/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 active:scale-95"
                                    }`}
                                >
                                    İyi (4 gün)
                                </button>
                                <button
                                    onClick={() => handleRating(5, 9)}
                                    disabled={!isFlipped || !!sm2Schedule}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                        !isFlipped
                                            ? "opacity-40 cursor-not-allowed border-zinc-800 text-zinc-500"
                                            : "border-emerald-900/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 active:scale-95"
                                    }`}
                                >
                                    Kolay (9 gün)
                                </button>
                            </div>
                        </div>

                        {/* Confirmation Toast */}
                        {sm2Schedule && (
                            <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between"
                            >
                                <span className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>SM-2 algoritması hesapladı: Bu kart <strong>{sm2Schedule.days} gün sonra</strong> tekrar listenize eklenecek.</span>
                                </span>
                                <span className="font-mono text-[11px] text-emerald-400">Öğrenme Serisi +1</span>
                            </motion.div>
                        )}
                    </div>
                )}

                {activeTab === "extractor" && (
                    <div className="space-y-5">
                        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-semibold text-zinc-100">Biyokimya_Hücresel_Solunum.pdf</h4>
                                    <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">38 Sayfa</span>
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Yapay zeka dokümanı analiz etti: 24 kritik flashcard, 6 çoktan seçmeli soru ve 3 sayfalık kavram özeti üretildi.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                                <span className="text-zinc-500 text-[11px] block">Üretilen Kart</span>
                                <strong className="text-base text-zinc-100 font-mono">24 Kart</strong>
                            </div>
                            <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                                <span className="text-zinc-500 text-[11px] block">Kazanım Zamanı</span>
                                <strong className="text-base text-emerald-400 font-mono">~3.5 Saat Tasarruf</strong>
                            </div>
                            <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                                <span className="text-zinc-500 text-[11px] block">İşlem Süresi</span>
                                <strong className="text-base text-sky-400 font-mono">14 Saniye</strong>
                            </div>
                        </div>

                        <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/40 text-xs text-zinc-400 flex items-center justify-between">
                            <span>Siz sadece dökümanınızı bırakın, gerisini Learnaxia organize etsin.</span>
                            <span className="text-purple-400 font-medium">Hemen Dene →</span>
                        </div>
                    </div>
                )}

                {activeTab === "solver" && (
                    <div className="space-y-5">
                        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                                <Camera className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-semibold text-zinc-100">Fotoğraftan Soru Analizi & Adım Adım Çözüm</h4>
                                    <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">OCR + Akıl Yürütme</span>
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Kitaptan veya deneme sınavından çektiğiniz bir soruyu anında metne döker, temel formülü açıklar ve adım adım çözümünü sunar.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2 p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs">
                            <div className="flex items-center justify-between text-zinc-400 pb-2 border-b border-zinc-800">
                                <span>Örnek Soru: <strong>Türev - Fiziksel Yorum</strong></span>
                                <span className="text-emerald-400">Çözüldü ✓</span>
                            </div>
                            <div className="text-zinc-300 font-mono text-[11px] leading-relaxed pt-1">
                                1. Adım: Konum fonksiyonu s(t) = 3t² - 4t + 1 türevi alınır: v(t) = s'(t) = 6t - 4<br />
                                2. Adım: t = 3 anındaki anlık hız için v(3) hesaplanır: 6(3) - 4 = 14 m/s.
                            </div>
                        </div>

                        <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/40 text-xs text-zinc-400 flex items-center justify-between">
                            <span>Sadece cevabı değil, mantığını öğrenin.</span>
                            <span className="text-emerald-400 font-medium">Mobilde de Mevcut →</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Bar */}
            <div className="px-6 py-3 border-t border-zinc-800/70 bg-zinc-900/30 flex items-center justify-between text-xs text-zinc-500">
                <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Canlı interaktif önizleme — Kartları tıklayarak deneyebilirsiniz
                </span>
                <span className="font-mono text-[11px] text-zinc-500 hidden sm:inline">Learnaxia Engine v2.4</span>
            </div>
        </div>
    );
}
