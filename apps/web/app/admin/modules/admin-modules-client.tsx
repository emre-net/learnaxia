"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
    Archive,
    Eye,
    Filter,
    Globe,
    Layers,
    Lock,
    RotateCcw,
    Search,
    Tag,
} from "lucide-react";

export interface AdminModuleItem {
    id: string;
    title: string;
    description: string | null;
    type: string;
    status: string;
    visibility: string;
    category: string | null;
    createdAt: string;
    owner: {
        handle: string | null;
        email: string | null;
    } | null;
    _count: {
        items: number;
    };
}

export function AdminModulesClient({ initialModules }: { initialModules: AdminModuleItem[] }) {
    const [modules, setModules] = useState<AdminModuleItem[]>(initialModules);
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("ALL");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [busyId, setBusyId] = useState<string | null>(null);

    const filteredModules = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return modules.filter((mod) => {
            if (typeFilter !== "ALL" && mod.type !== typeFilter) return false;
            if (statusFilter !== "ALL" && mod.status !== statusFilter) return false;
            if (!q) return true;
            return (
                mod.title.toLowerCase().includes(q) ||
                (mod.description || "").toLowerCase().includes(q) ||
                (mod.owner?.handle || "").toLowerCase().includes(q) ||
                (mod.category || "").toLowerCase().includes(q)
            );
        });
    }, [modules, searchQuery, typeFilter, statusFilter]);

    const handleToggleArchive = async (mod: AdminModuleItem) => {
        const nextStatus = mod.status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED";
        setBusyId(mod.id);
        try {
            const res = await fetch(`/api/admin/modules/${mod.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: nextStatus }),
            });
            if (!res.ok) return;
            setModules((prev) =>
                prev.map((m) => (m.id === mod.id ? { ...m, status: nextStatus } : m))
            );
        } finally {
            setBusyId(null);
        }
    };

    const types = ["ALL", "FLASHCARD", "MC", "TRUE_FALSE", "GAP"];
    const statuses = ["ALL", "ACTIVE", "ARCHIVED", "DRAFT"];

    return (
        <div className="space-y-6 text-[#f4f4f5]">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Modül Moderasyonu</h1>
                    <p className="text-zinc-400 mt-1.5 text-sm">
                        Sistemdeki modülleri arayın, tür/durum bazlı filtreleyin, inceleyin veya arşivleyin.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Modül, kategori veya @kullanıcı ara..."
                            className="bg-[#121215] border border-white/[0.08] rounded-xl py-2.5 pl-10 pr-4 w-full sm:w-72 text-sm text-[#f4f4f5] placeholder:text-zinc-500 focus:border-sky-500/60 outline-none"
                        />
                    </div>
                </div>
            </header>

            {/* Working Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#121215] border border-white/[0.06] rounded-2xl p-3">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400 px-2">
                        <Filter className="w-3.5 h-3.5" /> Tür:
                    </span>
                    {types.map((tp) => (
                        <button
                            key={tp}
                            type="button"
                            onClick={() => setTypeFilter(tp)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                typeFilter === tp
                                    ? "bg-sky-500 text-[#09090b]"
                                    : "bg-[#18181b] text-zinc-300 hover:bg-zinc-800"
                            }`}
                        >
                            {tp === "ALL" ? "Tümü" : tp}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-zinc-400 px-2">Durum:</span>
                    {statuses.map((st) => (
                        <button
                            key={st}
                            type="button"
                            onClick={() => setStatusFilter(st)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                statusFilter === st
                                    ? "bg-sky-500 text-[#09090b]"
                                    : "bg-[#18181b] text-zinc-300 hover:bg-zinc-800"
                            }`}
                        >
                            {st === "ALL" ? "Tümü" : st}
                        </button>
                    ))}
                </div>
            </div>

            <div className="text-xs text-zinc-500">
                {filteredModules.length} modül listeleniyor
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredModules.length === 0 ? (
                    <div className="col-span-full py-16 text-center bg-[#121215] rounded-2xl border border-dashed border-white/[0.08]">
                        <Layers className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                        <p className="text-zinc-400 text-sm">Eşleşen modül bulunamadı.</p>
                    </div>
                ) : (
                    filteredModules.map((mod) => {
                        const isArchived = mod.status === "ARCHIVED";
                        const isPublic = mod.visibility === "PUBLIC";
                        return (
                            <div
                                key={mod.id}
                                className="bg-[#121215] border border-white/[0.06] rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-sky-500/40 transition-colors"
                            >
                                <div>
                                    <div className="flex items-start justify-between mb-3.5">
                                        <div className="p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/20">
                                            <Layers className="w-5 h-5 text-sky-400" />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Link
                                                href={`/dashboard/modules/${mod.id}`}
                                                title="Modülü İncele"
                                                className="p-2 bg-[#18181b] hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-[#f4f4f5] transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            <button
                                                type="button"
                                                disabled={busyId === mod.id}
                                                onClick={() => handleToggleArchive(mod)}
                                                title={isArchived ? "Geri Yükle" : "Arşivle"}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    isArchived
                                                        ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                                        : "bg-[#18181b] text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400"
                                                }`}
                                            >
                                                {isArchived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="font-semibold text-base mb-1 line-clamp-1 text-[#f4f4f5]">
                                        {mod.title}
                                    </h3>
                                    <p className="text-xs text-zinc-400 line-clamp-2 min-h-[2rem] mb-3.5">
                                        {mod.description || "Açıklama belirtilmemiş."}
                                    </p>

                                    <div className="flex flex-wrap gap-1.5">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#18181b] border border-white/[0.06] rounded-lg text-[11px] text-zinc-300">
                                            <Tag className="w-3 h-3 text-sky-400" />
                                            {mod.type}
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#18181b] border border-white/[0.06] rounded-lg text-[11px] text-zinc-300">
                                            {isPublic ? <Globe className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3 text-zinc-500" />}
                                            {mod.visibility}
                                        </span>
                                        <span
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] border ${
                                                isArchived
                                                    ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                                                    : "bg-[#18181b] text-zinc-400 border-white/[0.06]"
                                            }`}
                                        >
                                            {mod.status} ({mod._count.items} kart)
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-3.5 border-t border-white/[0.06] flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-7 h-7 rounded-full bg-[#18181b] border border-white/[0.08] flex items-center justify-center shrink-0">
                                            <span className="text-[11px] font-bold text-zinc-300">
                                                {(mod.owner?.handle || "U")[0].toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="text-xs min-w-0">
                                            <div className="text-zinc-200 font-medium truncate">
                                                @{mod.owner?.handle || "unknown"}
                                            </div>
                                            <div className="text-zinc-500 text-[11px]">
                                                {new Date(mod.createdAt).toLocaleDateString("tr-TR")}
                                            </div>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/dashboard/modules/${mod.id}`}
                                        className="text-xs text-sky-400 font-medium hover:underline shrink-0"
                                    >
                                        İncele
                                    </Link>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
