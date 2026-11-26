"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
    Bot,
    User,
    ChevronLeft,
    ChevronRight,
    Search,
    RefreshCw,
    CheckCircle2,
    XCircle,
    ShieldCheck,
} from "lucide-react";
import { BrandLoader } from "@/components/ui/brand-loader";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface AILog {
    id: string;
    createdAt: string;
    level: string;
    requestId: string;
    message: string;
    metadata: {
        attempt: number;
        isExtraction: boolean;
        generatorInput: string;
        generatorSystemPrompt: string;
        generatorOutput: any[];
        checkerFeedback: string;
        errorMessage?: string;
        error?: string;
        model?: string;
    };
}

export default function AILogsPage() {
    const [logs, setLogs] = useState<AILog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedLog, setSelectedLog] = useState<AILog | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [levelFilter, setLevelFilter] = useState<"ALL" | "INFO" | "WARN" | "ERROR">("ALL");

    useEffect(() => {
        const t = setTimeout(() => {
            setPage(1);
            setDebouncedQuery(searchQuery);
        }, 300);
        return () => clearTimeout(t);
    }, [searchQuery]);

    const fetchLogs = async (pageNum: number, q: string, level: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(pageNum),
                limit: "15",
            });
            if (q.trim()) params.set("q", q.trim());
            if (level !== "ALL") params.set("level", level);

            const res = await fetch(`/api/admin/ai-logs?${params.toString()}`);
            if (!res.ok) return;
            const data = await res.json();
            const list: AILog[] = Array.isArray(data.logs) ? data.logs : [];
            setLogs(list);
            setTotalPages(data.metadata?.totalPages || 1);
            if (list.length > 0) {
                setSelectedLog((prev) =>
                    prev && list.some((l) => l.id === prev.id) ? prev : list[0]
                );
            } else {
                setSelectedLog(null);
            }
        } catch (error) {
            console.error("Failed to fetch AI logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(page, debouncedQuery, levelFilter);
    }, [page, debouncedQuery, levelFilter]);

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 min-h-[calc(100vh-4rem)] flex flex-col text-[#f4f4f5]">
            <div className="flex flex-wrap justify-between items-center gap-4 shrink-0">
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Bot className="w-7 h-7 text-sky-400" />
                        AI Agent Activity Monitor
                    </h1>
                    <p className="text-zinc-400 text-sm">
                        Generator ve Checker AI etkileşimlerini arayın ve seviyeye göre filtreleyin.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => fetchLogs(page, debouncedQuery, levelFilter)}
                    className="p-2.5 bg-[#121215] border border-white/[0.08] hover:bg-[#18181b] text-zinc-300 rounded-xl transition-colors"
                    title="Yenile"
                >
                    <RefreshCw className={cn("w-5 h-5", loading && "animate-spin text-sky-400")} />
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                {/* Left Panel: Request List */}
                <div className="w-full lg:w-1/3 flex flex-col bg-[#121215] border border-white/[0.06] rounded-2xl overflow-hidden max-h-[650px]">
                    <div className="p-3.5 border-b border-white/[0.06] bg-[#18181b]/60 space-y-2.5">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Mesaj veya request ID ara..."
                                className="w-full bg-[#121215] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-sm text-[#f4f4f5] placeholder:text-zinc-500 focus:outline-none focus:border-sky-500/60"
                            />
                        </div>
                        <div className="flex gap-1.5 overflow-x-auto">
                            {(["ALL", "INFO", "WARN", "ERROR"] as const).map((lvl) => (
                                <button
                                    key={lvl}
                                    type="button"
                                    onClick={() => {
                                        setPage(1);
                                        setLevelFilter(lvl);
                                    }}
                                    className={cn(
                                        "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                                        levelFilter === lvl
                                            ? "bg-sky-500 text-[#09090b]"
                                            : "bg-[#121215] text-zinc-400 hover:text-zinc-200 border border-white/[0.06]"
                                    )}
                                >
                                    {lvl === "ALL" ? "Tümü" : lvl}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {loading && logs.length === 0 ? (
                            <div className="flex justify-center p-8">
                                <BrandLoader size="md" />
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="p-8 text-center text-xs text-zinc-500">
                                Eşleşen log bulunamadı.
                            </div>
                        ) : (
                            logs.map((log) => (
                                <button
                                    key={log.id}
                                    type="button"
                                    onClick={() => setSelectedLog(log)}
                                    className={cn(
                                        "w-full text-left p-3.5 rounded-xl transition-colors border",
                                        selectedLog?.id === log.id
                                            ? "bg-[#18181b] border-sky-500/40 text-[#f4f4f5]"
                                            : "bg-transparent border-transparent hover:bg-[#18181b]/60 text-zinc-400 hover:text-zinc-200"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-1.5">
                                        <div className="flex items-center gap-2">
                                            {log.level === "INFO" ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                            ) : log.level === "WARN" ? (
                                                <RefreshCw className="w-4 h-4 text-amber-400" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-rose-400" />
                                            )}
                                            <span className="text-xs font-mono text-zinc-500">
                                                {log.createdAt ? format(new Date(log.createdAt), "HH:mm:ss") : "Unknown"}
                                            </span>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-[10px]",
                                                log.metadata?.isExtraction
                                                    ? "border-purple-500/30 text-purple-300"
                                                    : "border-sky-500/30 text-sky-300"
                                            )}
                                        >
                                            {log.metadata?.isExtraction ? "Extract" : "Generate"}
                                        </Badge>
                                    </div>
                                    <div className="text-sm font-medium truncate">{log.message}</div>
                                    <div className="text-xs text-zinc-500 truncate mt-1">
                                        Req: {log.requestId ? log.requestId.split("-")[0] : "Unknown"}...
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    <div className="p-3 border-t border-white/[0.06] flex items-center justify-between text-sm bg-[#18181b]/60">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                            className="p-1 hover:bg-zinc-800 rounded disabled:opacity-40"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-zinc-400 text-xs">Sayfa {page} / {totalPages}</span>
                        <button
                            type="button"
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => p + 1)}
                            className="p-1 hover:bg-zinc-800 rounded disabled:opacity-40"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Right Panel: Conversation View */}
                <div className="flex-1 bg-[#121215] border border-white/[0.06] rounded-2xl overflow-hidden flex flex-col max-h-[650px]">
                    {selectedLog ? (
                        <>
                            <div className="p-4 border-b border-white/[0.06] bg-[#18181b]/60 flex justify-between items-center gap-3">
                                <div className="min-w-0">
                                    <h3 className="font-semibold text-[#f4f4f5]">Session Details</h3>
                                    <div className="text-xs text-zinc-500 font-mono mt-1 truncate">
                                        ID: {selectedLog.requestId} | Attempt: {selectedLog.metadata?.attempt ?? 1}
                                    </div>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        selectedLog.level === "INFO"
                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                            : selectedLog.level === "WARN"
                                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                    )}
                                >
                                    {selectedLog.level === "INFO" ? "APPROVED" : selectedLog.level === "WARN" ? "RETRY REQUESTED" : "FAILED"}
                                </Badge>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {(selectedLog.metadata?.errorMessage || selectedLog.metadata?.error) && (
                                    <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-300 whitespace-pre-wrap font-mono text-sm max-h-[260px] overflow-y-auto">
                                        <div className="font-bold flex items-center gap-2 mb-2">
                                            <XCircle className="w-4 h-4" /> CRASH REPORT
                                        </div>
                                        {selectedLog.metadata.errorMessage || selectedLog.metadata.error}
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-[#18181b] border border-white/[0.08] flex items-center justify-center shrink-0">
                                        <User className="w-4 h-4 text-zinc-400" />
                                    </div>
                                    <div className="flex-1 space-y-2 min-w-0">
                                        <div className="font-medium text-sm text-zinc-300">User / System</div>
                                        <div className="bg-[#18181b] p-4 rounded-2xl rounded-tl-none border border-white/[0.06] text-zinc-300 text-sm whitespace-pre-wrap font-mono break-words">
                                            {selectedLog.metadata?.generatorInput || "N/A"}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 flex-row-reverse">
                                    <div className="w-8 h-8 rounded-full bg-sky-500/15 border border-sky-500/25 flex items-center justify-center shrink-0">
                                        <Bot className="w-4 h-4 text-sky-400" />
                                    </div>
                                    <div className="flex-1 space-y-2 min-w-0">
                                        <div className="font-medium text-sm text-sky-400 text-right">
                                            Generator AI {selectedLog.metadata?.model ? `(${selectedLog.metadata.model})` : ""}
                                        </div>
                                        <div className="bg-sky-500/10 p-4 rounded-2xl rounded-tr-none border border-sky-500/20 text-zinc-200 text-sm overflow-x-auto">
                                            <pre className="font-mono text-xs">
                                                {selectedLog.metadata?.generatorOutput
                                                    ? JSON.stringify(selectedLog.metadata.generatorOutput, null, 2)
                                                    : "N/A"}
                                            </pre>
                                        </div>
                                    </div>
                                </div>

                                {selectedLog.metadata?.checkerFeedback && (
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
                                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <div className="flex-1 space-y-2 min-w-0">
                                            <div className="font-medium text-sm text-emerald-400">Checker AI</div>
                                            <div
                                                className={cn(
                                                    "p-4 rounded-2xl rounded-tl-none border text-sm",
                                                    selectedLog.level === "INFO"
                                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
                                                        : "bg-amber-500/10 border-amber-500/20 text-amber-200"
                                                )}
                                            >
                                                {selectedLog.metadata.checkerFeedback}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 space-y-3 p-8">
                            <Bot className="w-12 h-12 opacity-30" />
                            <p className="text-sm">Detayları görmek için bir log kaydı seçin.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
