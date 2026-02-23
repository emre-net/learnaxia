"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    AlertCircle,
    Search,
    Filter,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Clock,
    ShieldAlert,
    Terminal,
    Database,
    Globe,
    User as UserIcon,
    Hash
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LogsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Check both Role and Email for admin status to handle session sync issues
    const isAdmin = (session?.user as any)?.role === "ADMIN" ||
        session?.user?.email === "netemre387@gmail.com";

    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [level, setLevel] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>({});

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                search,
                level,
                page: page.toString(),
                limit: "20"
            });
            const res = await fetch(`/api/admin/logs?${params}`);
            const data = await res.json();
            if (res.ok) {
                setLogs(data.logs);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error("Failed to fetch logs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            fetchLogs();
        }
    }, [page, level, isAdmin]);

    const getLevelBadge = (level: string) => {
        switch (level) {
            case 'CRITICAL': return <Badge variant="destructive" className="bg-red-700 text-white font-black animate-pulse"><ShieldAlert className="w-3 h-3 mr-1" /> CRITICAL</Badge>;
            case 'ERROR': return <Badge variant="destructive" className="font-bold"><AlertCircle className="w-3 h-3 mr-1" /> ERROR</Badge>;
            case 'WARN': return <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 font-bold"><Filter className="w-3 h-3 mr-1" /> WARN</Badge>;
            default: return <Badge variant="secondary" className="font-medium text-zinc-500">INFO</Badge>;
        }
    };

    if (status === "loading") {
        return <div className="p-8 flex items-center justify-center min-h-[60vh] text-slate-400"><RefreshCw className="animate-spin mr-2 h-5 w-5" /> Analiz Ediliyor...</div>;
    }

    if (!isAdmin) {
        return (
            <div className="p-8 space-y-8 max-w-lg mx-auto text-center pt-20">
                <div className="h-24 w-24 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
                    <ShieldAlert className="h-12 w-12 text-rose-500" />
                </div>
                <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Yetkisiz Erişim</h1>
                <p className="text-slate-400 font-medium">Bu sayfayı görüntülemek için yeterli yetkiniz bulunmuyor. Sistemdeki rolünüz: <span className="text-rose-400 font-bold uppercase">{(session?.user as any)?.role || 'QUEST'}</span></p>
                <Button onClick={() => router.push("/dashboard")} className="rounded-2xl h-12 px-8 font-black bg-white text-slate-950 mt-4 transition-all active:scale-95 hover:bg-slate-200">
                    Dashboard'a Dön
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end gap-4">
                <div className="space-y-2">
                    <h1 className="text-3xl font-black text-white flex items-center gap-3 italic uppercase tracking-tighter">
                        <Terminal className="h-8 w-8 text-indigo-400" />
                        SYSTEM<span className="text-indigo-400">LOGS</span>
                    </h1>
                    <p className="text-slate-400 font-medium">Uygulama genelindeki tüm aktiviteleri ve hataları gerçek zamanlı izleyin.</p>
                </div>
                <Button onClick={() => fetchLogs()} disabled={loading} className="rounded-2xl h-12 px-6 font-black bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-95 border-0">
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Kayıtları Tazele
                </Button>
            </div>

            <Card className="rounded-[2rem] border-slate-800 shadow-2xl bg-slate-900 overflow-hidden border">
                <CardHeader className="p-8 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative flex-1 min-w-[300px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Mesaj, Stack veya Request ID ara..."
                                className="pl-11 h-12 rounded-2xl border-slate-800 bg-slate-950 text-slate-100 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant={level === "" ? "default" : "outline"}
                                onClick={() => setLevel("")}
                                className={cn("rounded-xl h-10 px-4 font-bold transition-all border-slate-800", level === "" ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-400")}
                            >Hepsi</Button>
                            <Button
                                variant={level === "ERROR" ? "destructive" : "outline"}
                                onClick={() => setLevel("ERROR")}
                                className={cn("rounded-xl h-10 px-4 font-bold transition-all border-slate-800", level === "ERROR" ? "bg-red-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-red-500/10")}
                            >Error</Button>
                            <Button
                                variant={level === "CRITICAL" ? "destructive" : "outline"}
                                onClick={() => setLevel("CRITICAL")}
                                className={cn("rounded-xl h-10 px-4 font-bold transition-all border-slate-800", level === "CRITICAL" ? "bg-red-700 text-white animate-pulse" : "bg-slate-800 text-slate-400 hover:bg-red-700/10")}
                            >Critical</Button>
                            <Button
                                variant={level === "WARN" ? "secondary" : "outline"}
                                onClick={() => setLevel("WARN")}
                                className={cn("rounded-xl h-10 px-4 font-bold transition-all border-slate-800", level === "WARN" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-400 hover:bg-amber-500/10")}
                            >Warn</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/50 border-b border-slate-800">
                                    <th className="p-4 px-8 font-bold text-slate-500 text-[10px] uppercase tracking-[0.2em]">Zaman & Seviye</th>
                                    <th className="p-4 font-bold text-slate-500 text-[10px] uppercase tracking-[0.2em]">Kaynak & Servis</th>
                                    <th className="p-4 font-bold text-slate-500 text-[10px] uppercase tracking-[0.2em]">Mesaj & Detaylar</th>
                                    <th className="p-4 px-8 font-bold text-slate-500 text-[10px] uppercase tracking-[0.2em] text-right">Aksiyon</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-800/20 transition-colors group">
                                        <td className="p-4 px-8 whitespace-nowrap">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2 text-[11px] font-black text-slate-400">
                                                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                                    {new Date(log.createdAt).toLocaleTimeString()}
                                                </div>
                                                {getLevelBadge(log.level)}
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="flex flex-col gap-1.5 pt-1">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500">
                                                    {log.source === 'CLIENT' ? <Globe className="w-3 h-3 text-emerald-400" /> : <Database className="w-3 h-3 text-amber-500" />}
                                                    {log.source}
                                                </div>
                                                <Badge variant="outline" className="w-fit text-[9px] font-black tracking-widest border-slate-800 bg-slate-900 text-slate-300 uppercase">{log.service || 'unknown'}</Badge>
                                            </div>
                                        </td>
                                        <td className="p-4 max-w-2xl">
                                            <div className="flex flex-col gap-2">
                                                <div className="font-bold text-slate-100 text-sm leading-snug break-words">
                                                    {log.message}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3">
                                                    {log.requestId && (
                                                        <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                                                            <Hash className="w-2.5 h-2.5" /> ID: {log.requestId}
                                                        </div>
                                                    )}
                                                    {log.userId && (
                                                        <div className="flex items-center gap-1 text-[10px] font-black text-indigo-400/80 bg-indigo-500/5 px-2 py-0.5 rounded-md border border-indigo-500/10">
                                                            <UserIcon className="w-2.5 h-2.5" /> USER: {log.userId}
                                                        </div>
                                                    )}
                                                </div>
                                                {log.url && <div className="text-[10px] text-slate-500 truncate max-w-sm italic opacity-60">URL: {log.url}</div>}
                                            </div>
                                        </td>
                                        <td className="p-4 px-8 text-right align-top pt-5">
                                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 rounded-xl font-black text-[11px] transition-all bg-slate-800/50 hover:bg-indigo-500 hover:text-white" onClick={() => {
                                                console.log(log);
                                                alert(JSON.stringify(log, null, 2));
                                            }}>DETAYLAR</Button>
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={4} className="p-20 text-center text-slate-500 font-medium italic">
                                            Belirtilen kriterlere uygun log kaydı bulunamadı.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4 bg-slate-900/40 p-6 rounded-[1.5rem] border border-slate-800">
                <div className="text-slate-500 font-bold text-sm">
                    TOPLAM <span className="text-white tabular-nums font-black">{pagination.total || 0}</span> KAYIT ANALİZ EDİLDİ
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="rounded-xl h-10 w-10 border-slate-800 bg-slate-900 hover:bg-slate-800"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="font-black text-[12px] px-6 text-slate-300 uppercase tracking-widest bg-slate-950/50 py-2 rounded-xl border border-slate-800 tabular-nums">SAYFA {page} / {pagination.pages || 1}</div>
                    <Button
                        variant="outline"
                        size="icon"
                        disabled={page >= (pagination.pages || 1)}
                        onClick={() => setPage(p => p + 1)}
                        className="rounded-xl h-10 w-10 border-slate-800 bg-slate-900 hover:bg-slate-800"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
