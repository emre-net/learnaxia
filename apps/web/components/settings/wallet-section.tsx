
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
    id: string;
    amount: number;
    type: string;
    description: string | null;
    createdAt: string;
}

interface WalletSectionProps {
    data: {
        balance: number;
        currency: string;
        history: Transaction[];
    } | null;
    loading: boolean;
}

export function WalletSection({ data, loading }: WalletSectionProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!data) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">Cüzdan verisi bulunamadı.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="border-yellow-500/20">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent rounded-xl">
                        <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Mevcut Bakiye</span>
                        <span className="text-5xl font-bold mt-2 bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-amber-500">
                            {data.balance}
                        </span>
                        <span className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 font-medium">
                            {data.currency} Token
                        </span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <History className="h-4 w-4" /> İşlem Geçmişi
                    </CardTitle>
                    <CardDescription>Token kazanma ve harcama geçmişiniz.</CardDescription>
                </CardHeader>
                <CardContent>
                    {data.history.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-8">Henüz işlem yok.</p>
                    ) : (
                        <ScrollArea className="h-[300px]">
                            <div className="space-y-3">
                                {data.history.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors gap-3">
                                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                            <span className="text-sm font-medium truncate">{tx.description || tx.type}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(tx.createdAt).toLocaleDateString("tr-TR")}
                                            </span>
                                        </div>
                                        <span className={cn(
                                            "font-bold flex items-center text-sm",
                                            tx.amount > 0 ? "text-green-500" : "text-red-500"
                                        )}>
                                            {tx.amount > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
