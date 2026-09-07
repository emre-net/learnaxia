"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, BrainCircuit, Sparkles, BarChart3, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingStep {
    icon: React.ReactNode;
    title: string;
    description: string;
    cta?: { label: string; href: string };
}

const steps: OnboardingStep[] = [
    {
        icon: <Sparkles className="w-8 h-8 text-yellow-400" />,
        title: "Learnaxia'ya Hoş Geldin! 🎉",
        description:
            "Öğrenme platformuna katıldığın için teşekkürler. Bu kısa tanıtımla seni platforma alıştıralım. Toplam 3 adım, 30 saniye.",
    },
    {
        icon: <BookOpen className="w-8 h-8 text-blue-400" />,
        title: "Modül Oluştur",
        description:
            "Flashcard, soru-cevap veya Journey modülleri oluştur. AI destekli içerik üretimi ile saniyeler içinde kapsamlı modüller hazırlayabilirsin.",
        cta: { label: "İlk Modülünü Oluştur", href: "/dashboard/create" },
    },
    {
        icon: <BrainCircuit className="w-8 h-8 text-purple-400" />,
        title: "Akıllı Tekrar (SM-2)",
        description:
            "Platform, kartlarını SM-2 algoritmasıyla zamanlar. Tam doğru zamanda tekrar yaparak uzun süreli belleğe aktarırsın. Günlük 10 dakika büyük fark yaratır.",
        cta: { label: "Çalışmaya Başla", href: "/dashboard/library" },
    },
    {
        icon: <BarChart3 className="w-8 h-8 text-emerald-400" />,
        title: "Momentum Puanın",
        description:
            "Her gün çalıştıkça Momentum puanın artar. Tutarlı çalışma, doğruluk ve içerik üretimi seni liderboard'da üst sıralara taşır.",
        cta: { label: "Liderboard'a Bak", href: "/dashboard/leaderboard" },
    },
];

interface OnboardingModalProps {
    /** Server'dan gelen: kullanıcı onboarding'i tamamladı mı? */
    completed: boolean;
}

export function OnboardingModal({ completed }: OnboardingModalProps) {
    const [visible, setVisible] = useState(false);
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!completed) {
            // Sayfanın yüklenmesine küçük gecikme ekle
            const t = setTimeout(() => setVisible(true), 800);
            return () => clearTimeout(t);
        }
    }, [completed]);

    const markComplete = async () => {
        setSaving(true);
        try {
            await fetch("/api/user/onboarding-complete", { method: "POST" });
        } catch {
            // sessiz hata — bir dahaki girişte tekrar gösterilir
        } finally {
            setSaving(false);
            setVisible(false);
        }
    };

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep((s) => s + 1);
        } else {
            markComplete();
        }
    };

    const handleSkip = () => markComplete();

    const handleCta = (href: string) => {
        markComplete();
        router.push(href);
    };

    const current = steps[step];

    return (
        <AnimatePresence>
            {visible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]"
                        onClick={handleSkip}
                    />

                    {/* Modal */}
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="pointer-events-auto w-full max-w-md bg-[#080e1c] border border-white/10 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden">
                            {/* Gradient top bar */}
                            <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-400" />

                            <div className="p-8">
                                {/* Close */}
                                <button
                                    onClick={handleSkip}
                                    className="absolute top-6 right-6 text-white/30 hover:text-white/70 transition-colors"
                                    aria-label="Kapat"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                {/* Step dots */}
                                <div className="flex items-center gap-1.5 mb-8">
                                    {steps.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1 rounded-full transition-all duration-300 ${
                                                i === step
                                                    ? "w-6 bg-blue-500"
                                                    : i < step
                                                    ? "w-3 bg-white/30"
                                                    : "w-3 bg-white/10"
                                            }`}
                                        />
                                    ))}
                                    <span className="ml-auto text-xs text-white/30 font-medium">
                                        {step + 1} / {steps.length}
                                    </span>
                                </div>

                                {/* Icon */}
                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                                    {current.icon}
                                </div>

                                {/* Text */}
                                <h2 className="text-2xl font-black text-white mb-3 leading-tight">
                                    {current.title}
                                </h2>
                                <p className="text-white/55 leading-relaxed text-[15px] mb-8">
                                    {current.description}
                                </p>

                                {/* Actions */}
                                <div className="flex items-center gap-3">
                                    {current.cta && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs border-white/15 text-white/60 hover:text-white hover:border-white/30"
                                            onClick={() => handleCta(current.cta!.href)}
                                        >
                                            {current.cta.label}
                                        </Button>
                                    )}

                                    <Button
                                        onClick={handleNext}
                                        disabled={saving}
                                        className="ml-auto gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-blue-900/30"
                                    >
                                        {step < steps.length - 1 ? (
                                            <>
                                                İleri
                                                <ChevronRight className="w-4 h-4" />
                                            </>
                                        ) : (
                                            "Başlayalım 🚀"
                                        )}
                                    </Button>
                                </div>

                                {/* Skip */}
                                {step === 0 && (
                                    <button
                                        onClick={handleSkip}
                                        className="w-full mt-4 text-xs text-white/20 hover:text-white/40 transition-colors"
                                    >
                                        Atla
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
