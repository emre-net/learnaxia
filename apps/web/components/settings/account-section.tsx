
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import { EditProfileDialog } from "./edit-profile-dialog";

interface AccountSectionProps {
    user: {
        email?: string | null;
        handle?: string | null;
        image?: string | null;
    };
}

export function AccountSection({ user }: AccountSectionProps) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Profil Bilgileri</CardTitle>
                    <CardDescription>İsim, kullanıcı adı ve hesap resminizi yönetin.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Kullanıcı Adı</Label>
                            <div className="flex items-center gap-2">
                                <Input value={user.handle || ""} disabled className="bg-muted" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>E-posta</Label>
                            <Input value={user.email || ""} disabled className="bg-muted" />
                        </div>
                    </div>
                    <div className="pt-2">
                        <EditProfileDialog user={user} trigger={
                            <Button variant="outline" className="w-full md:w-auto">
                                <Pencil className="h-4 w-4 mr-2" /> Profili Düzenle
                            </Button>
                        } />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Güvenlik</CardTitle>
                    <CardDescription>Şifrenizi buradan güncelleyebilirsiniz.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline">Şifre Değiştir</Button>
                </CardContent>
            </Card>
        </div>
    );
}
