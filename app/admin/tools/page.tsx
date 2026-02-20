import {
    Database,
    RefreshCcw,
    Trash2,
    ShieldAlert,
    Wrench,
    Server,
    Zap
} from "lucide-react";

export default function AdminToolsPage() {
    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold">Veritabanı ve Bakım Araçları</h1>
                <p className="text-slate-400 mt-2">Sistemi onarmak, temizlemek veya verileri senkronize etmek için gelişmiş araçlar.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Maintenance Section */}
                <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 border-l-4 border-l-amber-500">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <Wrench className="w-5 h-5 text-amber-500" />
                        Veri Onarım (Rescue)
                    </h2>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                        Kullanıcı kütüphanelerinde (Library) eksik olan modülleri tespit eder ve
                        bu modülleri otomatik olarak kullanıcıların kütüphanesine geri ekler.
                        Veri bütünlüğü bozulduğunda manuel olarak tetiklenebilir.
                    </p>
                    <button className="w-full py-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group">
                        <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                        Reputation Repair Başlat
                    </button>
                </div>

                {/* Cleanup Section */}
                <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 border-l-4 border-l-red-500">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <Trash2 className="w-5 h-5 text-red-500" />
                        Tehlikeli Alan (Cleanup)
                    </h2>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                        Sistemdeki tüm modülleri, öğeleri ve çalışma oturumlarını kalıcı olarak siler.
                        Bu işlem geri alınamaz ve tüm veritabanı içeriğini sıfırlar.
                        Sadece geliştirme aşamasında kullanılmalıdır.
                    </p>
                    <button className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group italic">
                        <ShieldAlert className="w-5 h-5" />
                        Veritabanını Sıfırla (DİKKAT!)
                    </button>
                </div>

                {/* Integration Section */}
                <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 border-l-4 border-l-indigo-500">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <Server className="w-5 h-5 text-indigo-500" />
                        Cache & Session
                    </h2>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                        Uygulama genelindeki önbelleği (API Cache) temizler ve tüm aktif çalışma oturumlarını (Study Sessions) duraklatır.
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
