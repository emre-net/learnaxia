"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, MoreVertical, Shield, ShieldOff, UserCheck, UserX } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserActionsProps {
    user: {
        id: string;
        name: string | null;
        handle?: string | null;
        email: string | null;
        role: string;
        status: string;
    };
    onUpdated?: () => void;
}

export function UserActions({ user, onUpdated }: UserActionsProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [busy, setBusy] = useState(false);

    const mutateUser = async (payload: Record<string, unknown>, successMsg: string) => {
        if (busy) return;
        setBusy(true);
        try {
            const res = await fetch(`/api/admin/users/${user.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "İşlem başarısız");
            }
            toast({ title: "Başarılı", description: successMsg });
            onUpdated?.();
            router.refresh();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Kullanıcı güncellenemedi.";
            toast({ title: "Hata", description: message, variant: "destructive" });
        } finally {
            setBusy(false);
        }
    };

    const nextStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const nextRole = user.role === "ADMIN" ? "USER" : "ADMIN";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    disabled={busy}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
                    aria-label="Kullanıcı İşlemleri"
                >
                    <MoreVertical className="w-4 h-4 text-zinc-400" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 bg-[#121215] border-zinc-800 text-zinc-200">
                <DropdownMenuLabel className="text-xs text-zinc-400">
                    @{user.handle || user.email || "kullanıcı"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-800" />

                <DropdownMenuItem
                    disabled={busy}
                    className="gap-2 cursor-pointer focus:bg-zinc-800 text-sky-400"
                    onClick={() => mutateUser({ grantTokens: 50, reason: "Admin +50 bonus" }, "+50 AI Bonus Jeton tanımlandı.")}
                >
                    <Coins className="w-4 h-4" />
                    <span>+50 AI Jeton Tanımla</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                    disabled={busy}
                    className="gap-2 cursor-pointer focus:bg-zinc-800"
                    onClick={() =>
                        mutateUser(
                            { status: nextStatus },
                            nextStatus === "SUSPENDED" ? "Kullanıcı askıya alındı." : "Kullanıcı yeniden aktifleştirildi."
                        )
                    }
                >
                    {user.status === "ACTIVE" ? (
                        <>
                            <UserX className="w-4 h-4 text-amber-400" />
                            <span>Hesabı Askıya Al</span>
                        </>
                    ) : (
                        <>
                            <UserCheck className="w-4 h-4 text-emerald-400" />
                            <span>Hesabı Aktifleştir</span>
                        </>
                    )}
                </DropdownMenuItem>

                <DropdownMenuItem
                    disabled={busy}
                    className="gap-2 cursor-pointer focus:bg-zinc-800"
                    onClick={() =>
                        mutateUser(
                            { role: nextRole },
                            `Kullanıcı rolü ${nextRole} olarak güncellendi.`
                        )
                    }
                >
                    {user.role === "ADMIN" ? (
                        <>
                            <ShieldOff className="w-4 h-4 text-zinc-400" />
                            <span>Admin Yetkisini Kaldır</span>
                        </>
                    ) : (
                        <>
                            <Shield className="w-4 h-4 text-rose-400" />
                            <span>Admin Yap</span>
                        </>
                    )}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
