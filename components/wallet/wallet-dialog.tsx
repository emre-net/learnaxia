"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, History, Loader2, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type Transaction = {
    id: string;
    amount: number;
    type: string;
    description: string | null;
    createdAt: string;
};

type WalletData = {
    balance: number;
    currency: string;
    history: Transaction[];
};

export function WalletDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState<WalletData | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchWallet = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/wallet');
            if (res.ok) {
                setData(await res.json());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchWallet();
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 rounded-full border-yellow-500/50 hover:bg-yellow-500/10 hover:text-yellow-600 dark:text-yellow-400">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span>{data ? data.balance : '...'}</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Coins className="h-6 w-6 text-yellow-500" />
                        Axia Wallet
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-6 py-4">
                    {/* Balance Card */}
                    <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-xl border border-yellow-500/20">
                        <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Current Balance</span>
                        {loading && !data ? (
                            <Loader2 className="h-8 w-8 animate-spin mt-2" />
                        ) : (
                            <span className="text-5xl font-bold text-foreground mt-2">{data?.balance ?? 0}</span>
                        )}
                        <span className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Tokens Available</span>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold shadow-lg shadow-orange-500/20">
                            <Plus className="mr-2 h-4 w-4" /> Earn Tokens
                        </Button>
                        <Button variant="outline" className="w-full" disabled>
                            Send (Soon)
                        </Button>
                    </div>

                    {/* History */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                            <History className="h-4 w-4" /> Transaction History
                        </h4>
                        <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-muted/20">
                            {loading && !data ? (
                                <div className="flex justify-center p-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
                            ) : data?.history.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-8">No transactions yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {data?.history.map((tx) => (
                                        <div key={tx.id} className="flex items-center justify-between text-sm">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-medium">{tx.description || tx.type}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(tx.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <span className={cn(
                                                "font-bold flex items-center",
                                                tx.amount > 0 ? "text-green-500" : "text-red-500"
                                            )}>
                                                {tx.amount > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                                {tx.amount > 0 ? '+' : ''}{tx.amount}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
