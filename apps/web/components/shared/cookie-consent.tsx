"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/**
 * Cookie Consent Banner
 * KVKK ve GDPR uyumu için gerekli.
 * localStorage'da "cookie_consent" key'i ile tercih kaydedilir.
 */
export function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem("cookie_consent");
        if (!consent) {
            // Küçük bir gecikmeyle göster (sayfa yüklendikten sonra)
            setTimeout(() => setVisible(true), 1500);
        }
    }, []);

    const accept = () => {
        localStorage.setItem("cookie_consent", "accepted");
        setVisible(false);
    };

    const decline = () => {
        localStorage.setItem("cookie_consent", "declined");
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
            role="dialog"
            aria-label="Çerez bildirimi"
            aria-live="polite"
        >
            <div className="max-w-4xl mx-auto bg-[#0a1020]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-6 shadow-2xl shadow-black/50">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    {/* İkon */}
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-xl">
                        🍪
                    </div>

                    {/* Metin */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white mb-1">
                            Çerez Kullanımı
                        </p>
                        <p className="text-xs text-white/50 leading-relaxed">
                            Oturum güvenliğini sağlamak ve tercihlerinizi hatırlamak için zorunlu çerezler kullanıyoruz.
                            Reklam veya analitik amaçlı çerez kullanmıyoruz.{" "}
                            <Link href="/privacy" className="text-blue-400 hover:text-blue-300 transition-colors underline underline-offset-2">
                                Gizlilik Politikası
                            </Link>
                        </p>
                    </div>

                    {/* Butonlar */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={decline}
                            className="px-4 py-2 text-xs font-medium text-white/40 hover:text-white/70 transition-colors rounded-lg hover:bg-white/5"
                            aria-label="Zorunlu olmayan çerezleri reddet"
                        >
                            Reddet
                        </button>
                        <button
                            onClick={accept}
                            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors rounded-lg"
                            aria-label="Çerezleri kabul et"
                        >
                            Kabul Et
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
