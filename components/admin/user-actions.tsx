"use client"

import { useState } from "react"
import { MoreVertical, Coins, Settings, Shield, Trash2, ShieldAlert } from "lucide-react"
import { useRouter } from "next/navigation"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

interface UserActionsProps {
    user: {
        id: string
        name: string | null
        email: string | null
        role: string
        wallet?: { balance: number } | null
    }
}

export function UserActions({ user }: UserActionsProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [isTokenModalOpen, setIsTokenModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [tokenAmount, setTokenAmount] = useState<string>("")
    const [actionType, setActionType] = useState<"ADD" | "REMOVE">("ADD")

    const handleTokenAction = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!tokenAmount || isNaN(Number(tokenAmount))) return

        setIsLoading(true)
        try {
            const amount = Number(tokenAmount);
            const res = await fetch(`/api/admin/users/${user.id}/tokens`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: actionType === "ADD" ? amount : -amount,
                })
            })

            const textData = await res.text();
            let data;
            try {
                data = JSON.parse(textData);
            } catch (err) {
                console.error("Non-JSON Admin Token Response:", textData);
                throw new Error("Sunucu işlemi reddetti veya zaman aşımına uğradı. Lütfen sayfayı yenileyip tekrar deneyin.");
            }

            if (!res.ok) throw new Error(data?.error || "Token işlemi başarısız.");

            toast({
                title: "İşlem Başarılı",
                description: `${amount} Token kullanıcının cüzdanına ${actionType === "ADD" ? "eklendi" : "silindi"}.`,
            })
            setIsTokenModalOpen(false)
            setTokenAmount("")
            router.refresh()
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Hata",
                description: error.message,
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4 text-slate-500" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800 text-slate-200">
                    <DropdownMenuLabel>Kullanıcı İşlemleri</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-800" />

                    <DropdownMenuItem
                        className="gap-2 cursor-pointer focus:bg-slate-800"
                        onClick={() => setIsTokenModalOpen(true)}
                    >
                        <Coins className="w-4 h-4 text-emerald-400" />
                        <span>Token Yükle / Sil</span>
                    </DropdownMenuItem>

                </DropdownMenuContent>
            </DropdownMenu>

            {/* Token Action Dialog */}
            <Dialog open={isTokenModalOpen} onOpenChange={setIsTokenModalOpen}>
                <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-50">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Coins className="w-5 h-5 text-emerald-500" />
                            Token Yönetimi
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            <strong>{user.email}</strong> hesaplı kullanıcının cüzdanına token ekleyebilir veya eksiltebilirsiniz. <br />
                            Mevcut Bakiye: <strong className="text-emerald-400">{user.wallet?.balance || 0} Token</strong>
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleTokenAction} className="space-y-4 py-4">
                        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                            <button
                                type="button"
                                onClick={() => setActionType("ADD")}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${actionType === "ADD" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-500 hover:text-slate-300"}`}
                            >
                                Ekle (+)
                            </button>
                            <button
                                type="button"
                                onClick={() => setActionType("REMOVE")}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${actionType === "REMOVE" ? "bg-red-500/20 text-red-400" : "text-slate-500 hover:text-slate-300"}`}
                            >
                                Eksilt (-)
                            </button>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-slate-300">İşlem Miktarı</Label>
                            <Input
                                id="amount"
                                type="number"
                                min="1"
                                placeholder="Örn: 100"
                                required
                                value={tokenAmount}
                                onChange={(e) => setTokenAmount(e.target.value)}
                                className="bg-slate-950 border-slate-800 focus-visible:ring-indigo-500"
                            />
                        </div>

                        <DialogFooter className="mt-6">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsTokenModalOpen(false)}
                                className="text-slate-400 hover:text-white hover:bg-slate-800"
                            >
                                İptal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading || !tokenAmount}
                                className={actionType === "ADD" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"}
                            >
                                {isLoading ? "İşleniyor..." : "Onayla"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
