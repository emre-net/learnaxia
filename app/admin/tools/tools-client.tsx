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
    Loader2,
    CheckCircle2
} from "lucide-react";
import { repairLibrariesAction, resetContentAction } from "./actions";

export default function AdminToolsClient() {
    const [loading, setLoading] = useState<string | null>(null);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

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

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold">Veritabanı ve Bakım Araçları</h1>
                <p className="text-slate-400 mt-2">Sistemi onarmak, temizlemek veya verileri senkronize etmek için gelişmiş araçlar.</p>
            </header>

            {status && (
                <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                    {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                    <span className="font-medium">{status.message}</span>
                </div>
            )}

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
                        {loading === 'repair' ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />}
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
                        {loading === 'reset' ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldAlert className="w-5 h-5" />}
                        Veritabanını Sıfırla (DİKKAT!)
                    </button>
                </div>

                {/* Integration Section */}
                <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 border-l-4 border-l-indigo-500 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <Server className="w-5 h-5 text-indigo-500" />
                        Cache & Session
                    </h2>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                        Uygulama genelindeki önbelleği (API Cache) temizler.
                    </p>
                    <button className="w-full py-4 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 border border-indigo-500/20 rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
                        <Zap className="w-5 h-5" />
                        Global Cache Purge
                    </button>
                </div>
            </div>
        </div>
    );
}
