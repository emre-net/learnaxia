"use client";

import { useMemo, useState } from "react";
import { Users as UsersIcon, Mail, Calendar, Search, Coins } from "lucide-react";
import { UserActions } from "@/components/admin/user-actions";

export interface AdminUserRow {
    id: string;
    name: string | null;
    handle: string | null;
    email: string | null;
    role: string;
    status: string;
    aiBonusTokens: number;
    createdAt: string;
}

export function AdminUsersClient({ initialUsers }: { initialUsers: AdminUserRow[] }) {
    const [query, setQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<"ALL" | "USER" | "ADMIN">("ALL");

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return initialUsers.filter((u) => {
            if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
            if (!q) return true;
            return (
                (u.handle || "").toLowerCase().includes(q) ||
                (u.name || "").toLowerCase().includes(q) ||
                (u.email || "").toLowerCase().includes(q)
            );
        });
    }, [initialUsers, query, roleFilter]);

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-100">Kullanıcı Yönetimi</h1>
                    <p className="text-zinc-400 mt-2">Sistemdeki kullanıcıları arayın, askıya alın veya bonus AI jetonu tanımlayın.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex rounded-xl border border-zinc-800 bg-[#121215] p-1 text-xs">
                        {(["ALL", "USER", "ADMIN"] as const).map((r) => (
                            <button
                                key={r}
                                onClick={() => setRoleFilter(r)}
                                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                                    roleFilter === r
                                        ? "bg-sky-500 text-zinc-950"
                                        : "text-zinc-400 hover:text-zinc-200"
                                }`}
                            >
                                {r === "ALL" ? "Tümü" : r}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Handle, isim veya e-posta ara..."
                            className="bg-[#121215] border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 w-full md:w-72 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-sky-500/50"
                        />
                    </div>
                </div>
            </header>

            <div className="bg-[#121215] border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[#18181b] border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-400">
                                <th className="px-6 py-4 font-semibold">Kullanıcı</th>
                                <th className="px-6 py-4 font-semibold">Rol</th>
                                <th className="px-6 py-4 font-semibold">Durum</th>
                                <th className="px-6 py-4 font-semibold">Bonus Jeton</th>
                                <th className="px-6 py-4 font-semibold">Kayıt Tarihi</th>
                                <th className="px-6 py-4 text-right font-semibold">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 italic">
                                        Eşleşen kullanıcı bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((user) => (
                                    <tr key={user.id} className="hover:bg-[#18181b]/70 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#18181b] flex items-center justify-center border border-zinc-800">
                                                    <UsersIcon className="w-4 h-4 text-zinc-400" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-zinc-100">
                                                        {user.handle ? `@${user.handle}` : user.name || "İsimsiz"}
                                                    </div>
                                                    <div className="text-xs text-zinc-400 flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {user.email || "—"}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                                    user.role === "ADMIN"
                                                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                                        : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                                                }`}
                                            >
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <div
                                                    className={`w-1.5 h-1.5 rounded-full ${
                                                        user.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-500"
                                                    }`}
                                                />
                                                <span className="text-sm text-zinc-300 capitalize">{user.status.toLowerCase()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-sky-400">
                                                <Coins className="w-3.5 h-3.5" />
                                                {user.aiBonusTokens}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-zinc-400 flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <UserActions user={user} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
