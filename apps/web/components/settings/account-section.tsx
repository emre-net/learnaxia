"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { KeyRound, Pencil } from "lucide-react";
import { EditProfileDialog } from "./edit-profile-dialog";
import { useToast } from "@/components/ui/use-toast";
import { BrandLoader } from "@/components/ui/brand-loader";
import { ChangePasswordSchema } from "@learnaxia/shared";

interface AccountSectionProps {
    user: {
        name?: string | null;
        email?: string | null;
        handle?: string | null;
        image?: string | null;
    };
}

export function AccountSection({ user }: AccountSectionProps) {
    const { toast } = useToast();
    const [pwdOpen, setPwdOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [savingPwd, setSavingPwd] = useState(false);

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast({ title: "Hata", description: "Yeni parolalar eşleşmiyor.", variant: "destructive" });
            return;
        }
        const parsed = ChangePasswordSchema.safeParse({ currentPassword, newPassword });
        if (!parsed.success) {
            toast({
                title: "Geçersiz Bilgi",
                description: parsed.error.issues[0]?.message || "Lütfen şifre kurallarını kontrol edin.",
                variant: "destructive"
            });
            return;
        }

        setSavingPwd(true);
        try {
            const res = await fetch("/api/user/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(parsed.data),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Şifre değiştirilemedi");

            toast({ title: "Başarılı", description: "Şifreniz başarıyla güncellendi." });
            setPwdOpen(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            toast({
                title: "Hata",
                description: err.message || "Şifre güncellenemedi.",
                variant: "destructive",
            });
        } finally {
            setSavingPwd(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="bg-[#121215] border-white/[0.08]">
                <CardHeader>
                    <CardTitle className="text-zinc-100">Profil Bilgileri</CardTitle>
                    <CardDescription className="text-zinc-400">
                        Görünen isim, kullanıcı adı ve hesap resminizi yönetin.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Kullanıcı Adı</Label>
                            <Input value={user.handle ? `@${user.handle}` : ""} disabled className="bg-[#18181b] border-zinc-800 text-zinc-300" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-300">E-posta</Label>
                            <Input value={user.email || ""} disabled className="bg-[#18181b] border-zinc-800 text-zinc-300" />
                        </div>
                    </div>
                    <div className="pt-2">
                        <EditProfileDialog user={user} trigger={
                            <Button variant="outline" className="w-full md:w-auto border-zinc-700 hover:bg-zinc-800">
                                <Pencil className="h-4 w-4 mr-2" /> Profili Düzenle
                            </Button>
                        } />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-[#121215] border-white/[0.08]">
                <CardHeader>
                    <CardTitle className="text-zinc-100">Güvenlik</CardTitle>
                    <CardDescription className="text-zinc-400">Şifrenizi buradan güncelleyebilirsiniz.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Dialog open={pwdOpen} onOpenChange={setPwdOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="border-zinc-700 hover:bg-zinc-800 gap-2">
                                <KeyRound className="h-4 w-4" /> Şifre Değiştir
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md bg-[#121215] border-zinc-800 text-zinc-100">
                            <DialogHeader>
                                <DialogTitle>Şifre Değiştir</DialogTitle>
                                <DialogDescription className="text-zinc-400">
                                    Yeni şifreniz en az 8 karakter uzunluğunda olmalıdır.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-3">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="curr-pwd">Mevcut Şifre</Label>
                                    <Input
                                        id="curr-pwd"
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="bg-[#18181b] border-zinc-800"
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="new-pwd">Yeni Şifre</Label>
                                    <Input
                                        id="new-pwd"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="En az 8 karakter"
                                        className="bg-[#18181b] border-zinc-800"
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="conf-pwd">Yeni Şifre Tekrar</Label>
                                    <Input
                                        id="conf-pwd"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="bg-[#18181b] border-zinc-800"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setPwdOpen(false)} disabled={savingPwd}>
                                    İptal
                                </Button>
                                <Button onClick={handleChangePassword} disabled={savingPwd} className="bg-sky-500 hover:bg-sky-400 text-zinc-950 font-semibold">
                                    {savingPwd && <BrandLoader size="sm" className="mr-2" />}
                                    Güncelle
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>
        </div>
    );
}
