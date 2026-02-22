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

export default function LogsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const isAdmin = (session?.user as any)?.role === "ADMIN";

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
        fetchLogs();
    }, [page, level]);

    const getLevelBadge = (level: string) => {
        switch (level) {
            case 'CRITICAL': return <Badge variant="destructive" className="bg-red-700 text-white font-black animate-pulse"><ShieldAlert className="w-3 h-3 mr-1" /> CRITICAL</Badge>;
            case 'ERROR': return <Badge variant="destructive" className="font-bold"><AlertCircle className="w-3 h-3 mr-1" /> ERROR</Badge>;
            case 'WARN': return <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 font-bold"><Filter className="w-3 h-3 mr-1" /> WARN</Badge>;
            default: return <Badge variant="secondary" className="font-medium text-zinc-500">INFO</Badge>;
        }
    };

    if (status === "loading") {
        return <div className="p-8 flex items-center justify-center min-h-[60vh]"><RefreshCw className="animate-spin text-zinc-400" /></div>;
    }

    if (!isAdmin) {
        return (
            <div className="p-8 space-y-8 max-w-lg mx-auto text-center pt-20">
                <div className="h-24 w-24 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert className="h-12 w-12 text-rose-600 dark:text-rose-400" />
                </div>
                <h1 className="text-3xl font-black text-zinc-900 dark:text-white">Yetkisiz Erişim</h1>
                <p className="text-zinc-500 font-medium italic">Bu sayfayı görüntülemek için yeterli yetkiniz bulunmuyor. Sadece yöneticiler bu alana erişebilir.</p>
                <Button onClick={() => router.push("/dashboard")} className="rounded-2xl h-12 px-8 font-black bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 mt-4 transition-all active:scale-95">
                    Dashboard'a Dön
                </Button>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-end gap-4">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-zinc-900 dark:text-white flex items-center gap-3 italic">
                        <Terminal className="h-10 w-10 text-blue-600" />
                        SYSTEM<span className="text-blue-600">LOGS</span>
                    </h1>
                    <p className="text-zinc-500 font-medium">Uygulama genelindeki tüm aktiviteleri ve hataları gerçek zamanlı izleyin.</p>
                </div>
                <Button onClick={() => fetchLogs()} disabled={loading} className="rounded-2xl h-12 px-6 font-bold shadow-lg shadow-blue-500/10">
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Yenile
                </Button>
            </div>

            <Card className="rounded-[2.5rem] border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-500/5 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-xl overflow-hidden">
                <CardHeader className="p-8 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative flex-1 min-w-[300px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <Input
                                placeholder="Mesaj, Stack veya Request ID ara..."
                                className="pl-11 h-12 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant={level === "" ? "default" : "outline"}
                                onClick={() => setLevel("")}
                                className="rounded-xl h-10 px-4 font-bold transition-all"
                            >Hepsi</Button>
                            <Button
                                variant={level === "ERROR" ? "destructive" : "outline"}
                                onClick={() => setLevel("ERROR")}
                                className="rounded-xl h-10 px-4 font-bold transition-all"
                            >Error</Button>
                            <Button
                                variant={level === "CRITICAL" ? "destructive" : "outline"}
                                onClick={() => setLevel("CRITICAL")}
                                className="rounded-xl h-10 px-4 font-bold transition-all"
                            >Critical</Button>
                            <Button
                                variant={level === "WARN" ? "secondary" : "outline"}
                                onClick={() => setLevel("WARN")}
                                className="rounded-xl h-10 px-4 font-bold transition-all"
                            >Warn</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50/50 dark:bg-zinc-800/10 border-b border-zinc-100 dark:border-zinc-800">
                                    <th className="p-4 px-8 font-bold text-zinc-400 text-xs uppercase tracking-widest">Zaman & Seviye</th>
                                    <th className="p-4 font-bold text-zinc-400 text-xs uppercase tracking-widest">Kaynak & Servis</th>
                                    <th className="p-4 font-bold text-zinc-400 text-xs uppercase tracking-widest">Mesaj</th>
                                    <th className="p-4 px-8 font-bold text-zinc-400 text-xs uppercase tracking-widest text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group">
                                        <td className="p-4 px-8 whitespace-nowrap">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                                                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                                                    {new Date(log.createdAt).toLocaleTimeString()}
                                                </div>
                                                {getLevelBadge(log.level)}
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="flex flex-col gap-1.5 pt-1">
                                                <div className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400">
                                                    {log.source === 'CLIENT' ? <Globe className="w-3 h-3 text-emerald-500" /> : <Database className="w-3 h-3 text-amber-500" />}
                                                    {log.source}
                                                </div>
                                                <Badge variant="outline" className="w-fit text-[10px] font-black tracking-tighter border-zinc-200 dark:border-zinc-700">{log.service || 'unknown'}</Badge>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-2 max-w-2xl">
                                                <div className="font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                                                    {log.message}
                                                </div>
                                                {log.requestId && (
                                                    <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                                                        <Hash className="w-2.5 h-2.5" /> ID: {log.requestId}
                                                    </div>
                                                )}
                                                {log.userId && (
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
                                                        <UserIcon className="w-2.5 h-2.5" /> User: {log.userId}
                                                    </div>
                                                )}
                                                {log.url && <div className="text-[10px] text-zinc-400 truncate max-w-xs">{log.url}</div>}
                                            </div>
                                        </td>
                                        <td className="p-4 px-8 text-right align-top pt-5">
                                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 rounded-xl font-bold transition-all" onClick={() => {
                                                console.log(log);
                                                alert(JSON.stringify(log, null, 2));
                                            }}>İncele</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-between items-center py-4 bg-zinc-50/50 dark:bg-zinc-900/40 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                <div className="text-zinc-500 font-bold text-sm">
                    Toplam <span className="text-zinc-900 dark:text-zinc-100">{pagination.total || 0}</span> kayıt bulundu
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="rounded-xl h-10 w-10 border-2"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="font-black text-sm px-4">Sayfa {page} / {pagination.pages || 1}</div>
                    <Button
                        variant="outline"
                        size="icon"
                        disabled={page >= (pagination.pages || 1)}
                        onClick={() => setPage(p => p + 1)}
                        className="rounded-xl h-10 w-10 border-2"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
