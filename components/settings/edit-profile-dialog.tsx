"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface EditProfileDialogProps {
    user: {
        handle?: string | null;
        image?: string | null;
    };
    trigger?: React.ReactNode;
}

export function EditProfileDialog({ user, trigger }: EditProfileDialogProps) {
    const [open, setOpen] = useState(false);
    const [handle, setHandle] = useState(user.handle || "");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleSave = async () => {
        if (handle === user.handle) {
            setOpen(false);
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ handle }),
            });

            if (!res.ok) {
                const error = await res.text();
                throw new Error(error);
            }

            toast({ title: "Başarılı", description: "Profil güncellendi." });
            router.refresh();
            setOpen(false);
        } catch (error: any) {
            toast({
                title: "Hata",
                description: error.message || "Bir hata oluştu.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Profili Düzenle</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Profili Düzenle</DialogTitle>
                    <DialogDescription>
                        Profil bilgilerinizi buradan güncelleyebilirsiniz.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="handle">Kullanıcı Adı (Handle)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                            <Input
                                id="handle"
                                value={handle}
                                onChange={(e) => setHandle(e.target.value)}
                                className="pl-8"
                                placeholder="kullaniciadi"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Benzersiz olmalıdır. Sadece harf, rakam ve alt çizgi.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                        İptal
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading || !handle}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Kaydet
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
