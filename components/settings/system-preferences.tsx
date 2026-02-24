
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface SystemPreferencesProps {
    language: string;
    onLanguageChange: (val: string) => void;
    soundEnabled: boolean;
    onSoundEnabledChange: (val: boolean) => void;
}

export function SystemPreferences({
    language,
    onLanguageChange,
    soundEnabled,
    onSoundEnabledChange
}: SystemPreferencesProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Sistem Ayarları</CardTitle>
                <CardDescription>Dil ve uygulama tercihlerini yönetin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="language">Dil Seçimi</Label>
                    <Select value={language} onValueChange={onLanguageChange}>
                        <SelectTrigger id="language">
                            <SelectValue placeholder="Dil seçin" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="tr">Türkçe 🇹🇷</SelectItem>
                            <SelectItem value="en">English 🇬🇧</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                    <div className="space-y-0.5">
                        <Label className="text-base">Ses Efektleri</Label>
                        <p className="text-xs text-muted-foreground">Doğru/yanlış bildirimleri için ses çal.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch checked={soundEnabled} onCheckedChange={onSoundEnabledChange} />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                        <div className="space-y-0.5">
                            <Label className="text-base">E-posta Bildirimleri</Label>
                            <p className="text-xs text-muted-foreground">Önemli güncellemeleri e-posta ile al.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                        <div className="space-y-0.5">
                            <Label className="text-base">Uygulama İçi Bildirimler</Label>
                            <p className="text-xs text-muted-foreground">Yeni modül hatırlatıcıları ve başarılar.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                        <div className="space-y-0.5">
                            <Label className="text-base">Modül Hatırlatıcıları</Label>
                            <p className="text-xs text-muted-foreground">Yarım kalan çalışmaları günlük olarak hatırlat.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
