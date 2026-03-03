"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
    Bot,
    User,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Search,
    RefreshCw,
    CheckCircle2,
    XCircle,
    ShieldCheck
} from "lucide-react";
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
    };
}

export default function AILogsPage() {
    const [logs, setLogs] = useState<AILog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedLog, setSelectedLog] = useState<AILog | null>(null);

    const fetchLogs = async (pageNum: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/ai-logs?page=${pageNum}&limit=10`);
            const data = await res.json();
            setLogs(data.logs);
            setTotalPages(data.metadata.totalPages);
            if (data.logs.length > 0 && !selectedLog) {
                setSelectedLog(data.logs[0]);
            }
        } catch (error) {
            console.error("Failed to fetch AI logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6 h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex justify-between items-center shrink-0">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
                        <Bot className="w-8 h-8 text-indigo-400" />
                        AI Agent Activity Monitor
                    </h1>
                    <p className="text-slate-400">
                        Real-time monitoring of Generator & Checker AI interactions and internal thought processes.
                    </p>
                </div>
                <button
                    onClick={() => fetchLogs(page)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                    title="Refresh Logs"
                >
                    <RefreshCw className={cn("w-5 h-5", loading && "animate-spin text-indigo-400")} />
                </button>
            </div>

            <div className="flex gap-6 flex-1 min-h-0">
                {/* Left Panel: Request List */}
                <div className="w-1/3 flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-slate-800 bg-slate-800/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search requests..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {loading && logs.length === 0 ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                            </div>
                        ) : logs.map(log => (
                            <button
                                key={log.id}
                                onClick={() => setSelectedLog(log)}
                                className={cn(
                                    "w-full text-left p-4 rounded-lg transition-all border",
                                    selectedLog?.id === log.id
                                        ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-100"
                                        : "bg-transparent border-transparent hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"
                                )}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        {log.level === 'INFO' ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        ) : log.level === 'WARN' ? (
                                            <RefreshCw className="w-4 h-4 text-amber-400" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-red-400" />
                                        )}
                                        <span className="text-xs font-mono opacity-60">
                                            {log.createdAt ? format(new Date(log.createdAt), "HH:mm:ss") : "Unknown"}
                                        </span>
                                    </div>
                                    <Badge variant="outline" className={cn(
                                        "text-[10px] scale-90",
                                        log.metadata?.isExtraction ? "border-purple-500/30 text-purple-400" : "border-blue-500/30 text-blue-400"
                                    )}>
                                        {log.metadata?.isExtraction ? 'Extract' : 'Generate'}
                                    </Badge>
                                </div>
                                <div className="text-sm font-medium truncate">
                                    {log.message}
                                </div>
                                <div className="text-xs opacity-50 truncate mt-1">
                                    Req: {log.requestId ? log.requestId.split('-')[0] : 'Unknown'}...
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="p-3 border-t border-slate-800 flex items-center justify-between text-sm bg-slate-800/50">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-1 hover:bg-slate-700 rounded disabled:opacity-50"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-slate-400">Page {page} of {totalPages}</span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="p-1 hover:bg-slate-700 rounded disabled:opacity-50"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Right Panel: Conversation View */}
                <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                    {selectedLog ? (
                        <>
                            <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold text-slate-200">Session Details</h3>
                                    <div className="text-xs text-slate-500 font-mono mt-1">
                                        ID: {selectedLog.requestId} | Attempt: {selectedLog.metadata?.attempt}
                                    </div>
                                </div>
                                <Badge variant="outline" className={cn(
                                    selectedLog.level === 'INFO' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                        selectedLog.level === 'WARN' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                            "bg-red-500/10 text-red-400 border-red-500/20"
                                )}>
                                    {selectedLog.level === 'INFO' ? 'APPROVED' : selectedLog.level === 'WARN' ? 'RETRY REQUESTED' : 'FAILED'}
                                </Badge>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {(selectedLog.metadata?.errorMessage || selectedLog.metadata?.error) && (
                                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 mb-4 whitespace-pre-wrap font-mono text-sm max-h-[300px] overflow-y-auto">
                                        <div className="font-bold flex items-center gap-2 mb-2"><XCircle className="w-4 h-4" /> CRASH REPORT:</div>
                                        {selectedLog.metadata.errorMessage || selectedLog.metadata.error}
                                    </div>
                                )}

                                {/* User Prompt */}
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                                        <User className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="font-medium text-sm text-slate-300">User / System</div>
                                        <div className="bg-slate-800/50 p-4 rounded-2xl rounded-tl-none border border-slate-700/50 text-slate-300 text-sm whitespace-pre-wrap font-mono">
                                            {selectedLog.metadata?.generatorInput || "N/A (Veritabanı dışı hata / Prompt öncesi çökme)"}
                                        </div>
                                    </div>
                                </div>

                                {/* Generator AI Response */}
                                <div className="flex gap-4 flex-row-reverse">
                                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                                        <Bot className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="font-medium text-sm text-indigo-400 text-right">Generator AI (gpt-4o-mini)</div>
                                        <div className="bg-indigo-500/10 p-4 rounded-2xl rounded-tr-none border border-indigo-500/20 text-indigo-100/80 text-sm overflow-x-auto">
                                            <pre className="font-mono text-xs">
                                                {selectedLog.metadata?.generatorOutput ? JSON.stringify(selectedLog.metadata.generatorOutput, null, 2) : "N/A (Yapay Zeka çıktı üretemedi)"}
                                            </pre>
                                        </div>
                                    </div>
                                </div>

                                {/* Checker AI Feedback */}
                                {selectedLog.metadata?.checkerFeedback && (
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="font-medium text-sm text-emerald-400">Checker AI (Evaluator)</div>
                                            <div className={cn(
                                                "p-4 rounded-2xl rounded-tl-none border text-sm",
                                                selectedLog.level === 'INFO'
                                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
                                                    : "bg-amber-500/10 border-amber-500/20 text-amber-200"
                                            )}>
                                                {selectedLog.metadata?.checkerFeedback}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4">
                            <Bot className="w-16 h-16 opacity-20" />
                            <p>Select a log entry to view the agent conversation</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
