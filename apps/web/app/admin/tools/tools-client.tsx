"use client";

import { useState } from "react";
import {
    Database,
    RefreshCcw,
    Trash2,
    ShieldAlert,
    Wrench,
    Server,
    Zap,
    CheckCircle2,
    Sparkles,
    ExternalLink
} from "lucide-react";
import { BrandLoader } from "@/components/ui/brand-loader";
import { repairLibrariesAction, resetContentAction, seedTestDataAction, generateOfficialModuleAction } from "./actions";

export default function AdminToolsClient() {
    const [loading, setLoading] = useState<string | null>(null);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string, link?: string } | null>(null);

    // AI Generation Form State
    const [aiTopic, setAiTopic] = useState("");
    const [aiType, setAiType] = useState<string>("AUTO");
    const [aiCount, setAiCount] = useState<number>(8);

    const handleAction = async (name: string, action: () => Promise<any>) => {
        if (!confirm("Bu işlemi gerçekleştirmek istediğinize emin misiniz?")) return;

        setLoading(name);
        setStatus(null);
        try {
            const result = await action();
            if (result.success) {
                setStatus({ type: 'success', message: result.message });
            } else {
                setStatus({ type: 'error', message: result.message });
            }
        } catch (e) {
            setStatus({ type: 'error', message: "Bir hata oluştu." });
        } finally {
            setLoading(null);
        }
    };

    const handleAIGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = aiTopic.trim();
        if (!trimmed) {
            alert("Lütfen bir konu başlığı girin.");
            return;
        }

        setLoading('ai-generate');
        setStatus(null);
        try {
            const res = await generateOfficialModuleAction({
                topic: trimmed,
                type: aiType as any,
                count: Number(aiCount)
            });

            if (res.success && res.module) {
                setStatus({
                    type: 'success',
                    message: res.message,
                    link: `/dashboard/modules/${res.module.moduleId}`
                });
                setAiTopic("");
            } else {
                setStatus({ type: 'error', message: res.message });
            }
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || "Modül üretilemedi." });
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold">Veritabanı ve Bakım Araçları</h1>
                <p className="text-slate-400 mt-2">Sistemi onarmak, temizlemek veya verileri senkronize etmek için gelişmiş araçlar.</p>
            </header>

            {status && (
                <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                    <div className="flex items-center gap-3">
                        {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <ShieldAlert className="w-5 h-5 shrink-0" />}
                        <span className="font-medium">{status.message}</span>
                    </div>
                    {status.link && (
                        <a
                            href={status.link}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-sm font-semibold transition-colors"
                        >
                            Modülü İncele
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    )}
                </div>
            )}

            {/* AI Module Factory - Primary Card */}
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 border-l-4 border-l-indigo-500 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                        <Sparkles className="w-6 h-6 text-indigo-400" />
                        AI Modül Fabrikası (LearnAxia Official)
                    </h2>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        Admin Özel
                    </span>
                </div>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    İstediğiniz konuyu yazın. Yapay zeka konuyu analiz eder, en uygun soru tipini seçer, pedagojik soruları üretir ve resmi <strong>@learnaxia</strong> hesabı adına <strong>PUBLIC</strong> olarak Keşfet'e anında yayınlar.
                </p>

                <form onSubmit={handleAIGenerate} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                            Konu / İçerik Başlığı
                        </label>
                        <input
                            type="text"
                            value={aiTopic}
                            onChange={(e) => setAiTopic(e.target.value)}
                            placeholder="Örn: Osmanlı Yükselme Dönemi, Python Veri Yapıları, Hücre Organelleri..."
                            disabled={loading === 'ai-generate'}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                Soru Tipi
                            </label>
                            <select
                                value={aiType}
                                onChange={(e) => setAiType(e.target.value)}
                                disabled={loading === 'ai-generate'}
                                className="w-full px-3 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                            >
                                <option value="AUTO">🤖 Otomatik (AI En Uygununu Seçsin)</option>
                                <option value="FLASHCARD">📇 Flashcard (Kavram / Ön-Arka)</option>
                                <option value="MC">🔘 Çoktan Seçmeli (4 Seçenekli Test)</option>
                                <option value="TRUE_FALSE">⚖️ Doğru / Yanlış (Önerme Testi)</option>
                                <option value="GAP">✏️ Boşluk Doldurma (Cümle İçi)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                Kart / Soru Sayısı
                            </label>
                            <select
                                value={aiCount}
                                onChange={(e) => setAiCount(Number(e.target.value))}
                                disabled={loading === 'ai-generate'}
                                className="w-full px-3 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                            >
                                <option value={5}>5 Soru / Kart</option>
                                <option value={8}>8 Soru / Kart (Önerilen)</option>
                                <option value={10}>10 Soru / Kart</option>
                                <option value={12}>12 Soru / Kart</option>
                                <option value={15}>15 Soru / Kart</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading === 'ai-generate' || !aiTopic.trim()}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25"
                    >
                        {loading === 'ai-generate' ? (
                            <>
                                <BrandLoader size="sm" />
                                <span>AI Analiz Ediyor ve Üretiyor (Lütfen Bekleyin)...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                <span>LearnAxia Olarak Üret ve Yayınla</span>
                            </>
                        )}
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Maintenance Section */}
                <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 border-l-4 border-l-amber-500 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <Wrench className="w-5 h-5 text-amber-500" />
                        Veri Onarım (Rescue)
                    </h2>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                        Kullanıcı kütüphanelerinde (Library) eksik olan modülleri tespit eder ve
                        bu modülleri otomatik olarak kullanıcıların kütüphanesine geri ekler.
                    </p>
                    <button
                        disabled={!!loading}
                        onClick={() => handleAction('repair', repairLibrariesAction)}
                        className="w-full py-4 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-50 text-amber-500 border border-amber-500/20 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group"
                    >
                        {loading === 'repair' ? <BrandLoader size="sm"  /> : <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />}
                        Reputation Repair Başlat
                    </button>
                </div>

                {/* Cleanup Section */}
                <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 border-l-4 border-l-red-500 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <Trash2 className="w-5 h-5 text-red-500" />
                        Tehlikeli Alan (Cleanup)
                    </h2>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                        Sistemdeki tüm modülleri, öğeleri ve çalışma oturumlarını kalıcı olarak siler.
                        Bu işlem geri alınamaz.
                    </p>
                    <button
                        disabled={!!loading}
                        onClick={() => handleAction('reset', resetContentAction)}
                        className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 text-red-500 border border-red-500/20 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group italic"
                    >
                        {loading === 'reset' ? <BrandLoader size="sm"  /> : <ShieldAlert className="w-5 h-5" />}
                        Veritabanını Sıfırla (DİKKAT!)
                    </button>
                </div>

                <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 border-l-4 border-l-green-500 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <Database className="w-5 h-5 text-green-500" />
                        Test Verisi (Seeder)
                    </h2>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                        Sisteme 6 çeşitli Modül, 5 Koleksiyon ve 3 Not ekler. Tümü otomatik "learnaxia" hesabı adına yayınlanır.
                    </p>
                    <button
                        disabled={!!loading}
                        onClick={() => handleAction('seed-test', seedTestDataAction)}
                        className="w-full py-4 bg-green-500/10 hover:bg-green-500/20 disabled:opacity-50 text-green-500 border border-green-500/20 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                        {loading === 'seed-test' ? <BrandLoader size="sm"  /> : <Database className="w-5 h-5" />}
                        Otomatik Test Verisi Üret
                    </button>
                </div>


            </div>
        </div>
    );
}
