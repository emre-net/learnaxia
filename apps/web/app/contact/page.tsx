"use client";

import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { Mail, MessageSquare, CheckCircle2, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

function GithubIcon({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg
            className={className}
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
            />
        </svg>
    );
}

export default function ContactPage() {
    const [submitted, setSubmitted] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !message.trim()) return;
        setSubmitted(true);
    };

    return (
        <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-sky-500/20">
            <Navbar />

            <main className="flex-1 pt-32 pb-24">
                <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-400 text-xs font-mono mb-6">
                        <span>İLETİŞİM & DESTEK MERKEZİ</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-100 mb-4">
                        Bizimle iletişime geçin.
                    </h1>
                    <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl mb-12">
                        Bir öneriniz, hata bildiriminiz veya sormak istediğiniz bir konu mu var? 
                        Doğrudan geliştiriciye ulaşın; tüm geri bildirimler dikkatle okunur ve yanıtlanır.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Direct Channels */}
                        <div className="space-y-6">
                            <h2 className="text-lg font-bold text-zinc-100 mb-4">
                                Doğrudan Kanallar
                            </h2>

                            <a
                                href="mailto:hello@learnaxia.com"
                                className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-zinc-700 transition-all flex items-start gap-4 group block"
                            >
                                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                                        E-posta
                                    </span>
                                    <strong className="text-sm sm:text-base text-zinc-200 group-hover:text-white transition-colors block">
                                        hello@learnaxia.com
                                    </strong>
                                    <span className="text-xs text-zinc-400 mt-1 block">
                                        Genellikle 24 saat içinde yanıtlanır
                                    </span>
                                </div>
                            </a>

                            <a
                                href="https://github.com/emre-net/learnaxia"
                                target="_blank"
                                rel="noreferrer"
                                className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-zinc-700 transition-all flex items-start gap-4 group block"
                            >
                                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
                                    <GithubIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                                        Açık Kaynak & GitHub
                                    </span>
                                    <strong className="text-sm sm:text-base text-zinc-200 group-hover:text-white transition-colors block">
                                        github.com/emre-net/learnaxia
                                    </strong>
                                    <span className="text-xs text-zinc-400 mt-1 block">
                                        Hata bildirimleri ve katkılar için
                                    </span>
                                </div>
                            </a>

                            {/* Trust Note */}
                            <div className="p-5 rounded-2xl border border-zinc-800/60 bg-zinc-900/20 text-xs text-zinc-400 space-y-2">
                                <div className="flex items-center gap-2 font-medium text-zinc-300">
                                    <Clock className="w-4 h-4 text-sky-400" />
                                    <span>Hızlı ve Samimi Destek</span>
                                </div>
                                <p className="leading-relaxed">
                                    Otomatik bot yanıtları yok. Mesajınız doğrudan ürünün geliştiricisine iletilir.
                                </p>
                            </div>
                        </div>

                        {/* Direct Form */}
                        <div className="p-6 sm:p-8 rounded-2xl border border-zinc-800 bg-zinc-900/40">
                            {submitted ? (
                                <div className="py-12 flex flex-col items-center text-center space-y-3">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-zinc-100">Mesajınız Alındı</h3>
                                    <p className="text-xs text-zinc-400 max-w-xs">
                                        Geri bildiriminiz için teşekkürler. İnceleyip en kısa sürede size dönüş yapacağız.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSubmitted(false);
                                            setMessage("");
                                        }}
                                        className="mt-4 border-zinc-800 text-xs"
                                    >
                                        Yeni Mesaj Gönder
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <h3 className="text-base font-bold text-zinc-100 mb-1">
                                        Doğrudan Mesaj Bırakın
                                    </h3>
                                    <p className="text-xs text-zinc-400 mb-4">
                                        Formu doldurarak önerinizi hemen iletebilirsiniz.
                                    </p>

                                    <div>
                                        <label className="text-xs font-mono text-zinc-400 block mb-1.5">
                                            İsminiz
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Adınız Soyadınız"
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950/80 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-mono text-zinc-400 block mb-1.5">
                                            E-posta Adresiniz *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="ornek@posta.com"
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950/80 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-mono text-zinc-400 block mb-1.5">
                                            Mesajınız *
                                        </label>
                                        <textarea
                                            required
                                            rows={4}
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Düşüncelerinizi veya sorunuzu buraya yazın..."
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950/80 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500 resize-none"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-sky-500 hover:bg-sky-400 text-zinc-950 font-semibold py-2.5 rounded-xl transition-all"
                                    >
                                        <Send className="w-4 h-4 mr-2" /> Gönder
                                    </Button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
