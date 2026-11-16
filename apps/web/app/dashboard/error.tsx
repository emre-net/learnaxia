"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        logger.error("Dashboard page error caught by dashboard/error.tsx", {
            metadata: {
                message: error.message,
                digest: error.digest,
                stack: error.stack,
            },
            context: "DashboardErrorBoundary",
        });
        console.error("[DashboardError]", error);
    }, [error]);

    return (
        <div className="min-h-[420px] flex flex-col items-center justify-center p-6 sm:p-10 text-center bg-zinc-900/40 rounded-3xl border border-white/10 backdrop-blur-md max-w-xl mx-auto my-8">
            <div className="h-16 w-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5">
                <AlertCircle className="h-8 w-8 text-rose-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
                Sayfa Yüklenirken Bir Sorun Oluştu
            </h2>
            <p className="text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
                İçerik yüklenirken beklenmeyen bir hata ile karşılaşıldı. Lütfen tekrar deneyin veya ana sayfaya dönün.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <Button
                    onClick={() => {
                        reset();
                        if (typeof window !== "undefined") {
                            window.location.reload();
                        }
                    }}
                    className="w-full sm:w-auto rounded-xl h-11 px-6 font-bold bg-white text-zinc-900 hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <RotateCcw className="h-4 w-4" />
                    Tekrar Dene
                </Button>
                <Button
                    variant="outline"
                    onClick={() => {
                        if (typeof window !== "undefined") {
                            window.location.href = "/dashboard";
                        }
                    }}
                    className="w-full sm:w-auto rounded-xl h-11 px-6 font-semibold border-white/15 text-zinc-300 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                >
                    <Home className="h-4 w-4" />
                    Dashboard&apos;a Dön
                </Button>
            </div>
        </div>
    );
}
