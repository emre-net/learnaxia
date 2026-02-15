
import { User, Bell, Shield, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Profil ve Ayarlar</h1>
                <p className="text-muted-foreground">Hesap tercihlerinizi ve kişisel bilgilerinizi yönetin.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar Navigation for Settings */}
                <div className="md:col-span-1 space-y-1">
                    <Button variant="secondary" className="w-full justify-start">
                        <User className="mr-2 h-4 w-4" /> Genel
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                        <Bell className="mr-2 h-4 w-4" /> Bildirimler
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                        <Shield className="mr-2 h-4 w-4" /> Güvenlik
                    </Button>
                </div>

                {/* Content Area */}
                <div className="md:col-span-3 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profil Bilgileri</CardTitle>
                            <CardDescription>Başkalarının sizi nasıl göreceğini güncelleyin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Ad Soyad</Label>
                                <Input id="name" placeholder="Adınız" defaultValue="Kullanıcı" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">E-posta</Label>
                                <Input id="email" placeholder="ornek@email.com" disabled />
                                <p className="text-xs text-muted-foreground">E-posta adresi değiştirilemez.</p>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button>Kaydet</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Şifre</CardTitle>
                            <CardDescription>Hesap güvenliğinizi sağlamak için güçlü bir şifre kullanın.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button variant="outline">Şifre Değiştir</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
