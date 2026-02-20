import prisma from "@/lib/prisma";
import {
    Layers,
    Tag,
    Eye,
    Trash2,
    Archive,
    Search,
    Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

export default async function AdminModulesPage() {
    const modules = await prisma.module.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            owner: {
                select: { handle: true, email: true }
            },
            _count: {
                select: { items: true }
            }
        },
        take: 50
    });

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Modül Moderasyonu</h1>
                    <p className="text-slate-400 mt-2">Sistemdeki tüm modülleri izleyin, arşivleyin veya içeriklerini denetleyin.</p>
                </div>

                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition-colors">
                        <Filter className="w-4 h-4" />
                        <span>Filtre</span>
                    </button>
                    <div className="relative group overflow-hidden">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Modül ara..."
                            className="bg-slate-900 border border-slate-800 rounded-xl py-3 pl-12 pr-4 w-full md:w-80 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all outline-none"
                        />
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {modules.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-slate-900 rounded-3xl border border-dashed border-slate-800">
                        <Layers className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 italic">Henüz modül oluşturulmamış.</p>
                    </div>
                ) : (
                    modules.map((mod) => (
                        <div key={mod.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-indigo-500/10 rounded-2xl group-hover:bg-indigo-500/20 transition-colors">
                                        <Layers className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div className="flex gap-2">
                                        <button title="Detaylar" className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-200 transition-all">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button title="Sil" className="p-2 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="font-bold text-lg mb-1 line-clamp-1 text-slate-100 group-hover:text-white transition-colors">{mod.title}</h3>
                                <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">
                                    {mod.description || 'Açıklama belirtilmemiş.'}
                                </p>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 rounded-full text-xs text-slate-400">
                                        <Tag className="w-3 h-3" />
                                        {mod.type}
                                    </span>
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 rounded-full text-xs text-slate-400">
                                        {mod._count.items} Öge
                                    </span>
                                    {mod.status === 'ARCHIVED' && (
                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 rounded-full text-xs text-amber-400 border border-amber-500/20">
                                            <Archive className="w-3 h-3" />
                                            Arşivlendi
                                        </span>
                                    )}
                                </div>

                                <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                                            <span className="text-[10px] uppercase font-bold text-slate-400">{(mod.owner?.handle || 'U')[0]}</span>
                                        </div>
                                        <div className="text-xs">
                                            <div className="text-slate-300 font-medium">@{mod.owner?.handle || 'unknown'}</div>
                                            <div className="text-slate-500">{new Date(mod.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <button className="text-xs text-indigo-400 font-semibold hover:underline">Bağlantılara Bak</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
