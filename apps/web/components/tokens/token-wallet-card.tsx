"use client";

import { useCallback, useEffect, useState } from "react";
import { Coins, Sparkles, RefreshCw, Smartphone } from "lucide-react";
import { TOKEN_CONFIG, TokenBalanceSummary } from "@learnaxia/shared";
import { Button } from "@/components/ui/button";

interface TokenWalletCardProps {
    compact?: boolean;
    refreshSignal?: number;
}

export function TokenWalletCard({ compact = false, refreshSignal = 0 }: TokenWalletCardProps) {
    const [wallet, setWallet] = useState<TokenBalanceSummary | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchWallet = useCallback(async () => {
        try {
            const res = await fetch("/api/tokens/balance", { cache: "no-store" });
            if (res.ok) {
                const data = (await res.json()) as TokenBalanceSummary;
                setWallet(data);
            }
        } catch {
            // Non-critical wallet widget fallback
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWallet();
    }, [fetchWallet, refreshSignal]);

    if (compact) {
        return (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-[#121215] px-4 py-3 text-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
                        <Coins className="h-4 w-4" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 font-semibold text-zinc-100">
                            <span>AI Jeton Bakiyesi:</span>
                            <span className="text-sky-400 font-bold">
                                {loading ? "..." : `${wallet?.totalAvailable ?? TOKEN_CONFIG.DAILY_FREE_TOKENS}`}
                            </span>
                        </div>
                        <p className="text-xs text-zinc-400">
                            Günlük ücretsiz {wallet?.dailyFreeRemaining ?? TOKEN_CONFIG.DAILY_FREE_TOKENS}/{wallet?.dailyFreeLimit ?? TOKEN_CONFIG.DAILY_FREE_TOKENS} +{" "}
                            {wallet?.bonusTokens ?? 0} bonus jeton
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Smartphone className="h-3.5 w-3.5 text-sky-400" />
                    <span>Mobilde ödüllü reklamla +{TOKEN_CONFIG.REWARDED_AD_BONUS} bonus jeton kazan</span>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/15 border border-sky-500/20 text-sky-400">
                        <Coins className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-zinc-100">AI Jeton Cüzdanı</h3>
                        <p className="text-xs text-zinc-400">
                            Elle oluşturma, çalışma, not ve çizimler sınırsız ve ücretsizdir.
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={fetchWallet}
                    className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                    title="Bakiyeyi Yenile"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-zinc-800 bg-[#18181b] p-3.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                        Toplam Kullanılabilir
                    </span>
                    <div className="mt-1 text-2xl font-black text-sky-400">
                        {loading ? "—" : wallet?.totalAvailable ?? TOKEN_CONFIG.DAILY_FREE_TOKENS}
                    </div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-[#18181b] p-3.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                        Günlük Ücretsiz Hak
                    </span>
                    <div className="mt-1 text-2xl font-black text-zinc-100">
                        {loading ? "—" : `${wallet?.dailyFreeRemaining ?? TOKEN_CONFIG.DAILY_FREE_TOKENS} / ${wallet?.dailyFreeLimit ?? TOKEN_CONFIG.DAILY_FREE_TOKENS}`}
                    </div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-[#18181b] p-3.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                        Biriken Bonus Jeton
                    </span>
                    <div className="mt-1 text-2xl font-black text-emerald-400">
                        {loading ? "—" : `+${wallet?.bonusTokens ?? 0}`}
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-sky-500/20 bg-sky-500/5 px-4 py-3 text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-sky-400 shrink-0" />
                    <span>
                        AI maliyetlerini abonelik almadan sürdürmek için Learnaxia Mobilde isteğe bağlı kısa ödüllü reklam izleyerek günlük {TOKEN_CONFIG.MAX_DAILY_REWARDED_ADS} keze kadar +{TOKEN_CONFIG.REWARDED_AD_BONUS} bonus jeton kazanabilirsiniz; hesabınızda anında birleşir.
                    </span>
                </div>
            </div>
        </div>
    );
}
