"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSettingsStore } from "@/stores/settings-store";
import { useTranslation } from "@/lib/i18n/i18n";
import { useToast } from "@/components/ui/use-toast";

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
    const { t } = useTranslation();
    const { toast } = useToast();
    const showStudyTimer = useSettingsStore(s => s.showStudyTimer);
    const setShowStudyTimer = useSettingsStore(s => s.setShowStudyTimer);

    const [emailNotifications, setEmailNotifications] = useState(true);
    const [inAppNotifications, setInAppNotifications] = useState(true);
    const [moduleNotifications, setModuleNotifications] = useState(true);

    useEffect(() => {
        let active = true;
        fetch("/api/user/settings")
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (!active || !data) return;
                if (typeof data.emailNotifications === "boolean") setEmailNotifications(data.emailNotifications);
                if (typeof data.inAppNotifications === "boolean") setInAppNotifications(data.inAppNotifications);
                if (typeof data.moduleNotifications === "boolean") setModuleNotifications(data.moduleNotifications);
                if (typeof data.soundEnabled === "boolean") onSoundEnabledChange(data.soundEnabled);
                if (typeof data.showStudyTimer === "boolean") setShowStudyTimer(data.showStudyTimer);
            })
            .catch(() => {});
        return () => { active = false; };
    }, []);

    const persistSetting = async (patch: Record<string, boolean>) => {
        try {
            const res = await fetch("/api/user/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch),
            });
            if (!res.ok) throw new Error();
        } catch {
            toast({ title: "Hata", description: "Tercih sunucuya kaydedilemedi.", variant: "destructive" });
        }
    };

    return (
        <Card className="bg-[#121215] border-white/[0.08]">
            <CardHeader>
                <CardTitle className="text-zinc-100">{t('settings.preferences.title')}</CardTitle>
                <CardDescription className="text-zinc-400">{t('settings.preferences.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="language">{t('settings.preferences.languageLabel')}</Label>
                    <Select value={language} onValueChange={onLanguageChange}>
                        <SelectTrigger id="language" className="bg-[#18181b] border-zinc-800">
                            <SelectValue placeholder={t('settings.preferences.languagePlaceholder')} />
                        </SelectTrigger>
                        <SelectContent className="bg-[#18181b] border-zinc-800">
                            <SelectItem value="tr">Türkçe</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center justify-between p-4 border border-white/[0.08] rounded-xl bg-[#18181b]/70">
                    <div className="space-y-0.5 pr-4">
                        <Label className="text-sm font-medium text-zinc-100">{t('settings.preferences.soundLabel')}</Label>
                        <p className="text-xs text-zinc-400">{t('settings.preferences.soundDesc')}</p>
                    </div>
                    <Switch
                        checked={soundEnabled}
                        onCheckedChange={(val) => {
                            onSoundEnabledChange(val);
                            persistSetting({ soundEnabled: val });
                        }}
                    />
                </div>

                <div className="flex items-center justify-between p-4 border border-white/[0.08] rounded-xl bg-[#18181b]/70">
                    <div className="space-y-0.5 pr-4">
                        <Label className="text-sm font-medium text-zinc-100">{t('settings.preferences.focusLabel')}</Label>
                        <p className="text-xs text-zinc-400">{t('settings.preferences.focusDesc')}</p>
                    </div>
                    <Switch
                        checked={showStudyTimer}
                        onCheckedChange={(val) => {
                            setShowStudyTimer(val);
                            persistSetting({ showStudyTimer: val });
                        }}
                    />
                </div>

                <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between p-4 border border-white/[0.08] rounded-xl bg-[#18181b]/70">
                        <div className="space-y-0.5 pr-4">
                            <Label className="text-sm font-medium text-zinc-100">{t('settings.preferences.emailLabel')}</Label>
                            <p className="text-xs text-zinc-400">{t('settings.preferences.emailDesc')}</p>
                        </div>
                        <Switch
                            checked={emailNotifications}
                            onCheckedChange={(val) => {
                                setEmailNotifications(val);
                                persistSetting({ emailNotifications: val });
                            }}
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 border border-white/[0.08] rounded-xl bg-[#18181b]/70">
                        <div className="space-y-0.5 pr-4">
                            <Label className="text-sm font-medium text-zinc-100">{t('settings.preferences.inAppLabel')}</Label>
                            <p className="text-xs text-zinc-400">{t('settings.preferences.inAppDesc')}</p>
                        </div>
                        <Switch
                            checked={inAppNotifications}
                            onCheckedChange={(val) => {
                                setInAppNotifications(val);
                                persistSetting({ inAppNotifications: val });
                            }}
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 border border-white/[0.08] rounded-xl bg-[#18181b]/70">
                        <div className="space-y-0.5 pr-4">
                            <Label className="text-sm font-medium text-zinc-100">{t('settings.preferences.moduleLabel')}</Label>
                            <p className="text-xs text-zinc-400">{t('settings.preferences.moduleDesc')}</p>
                        </div>
                        <Switch
                            checked={moduleNotifications}
                            onCheckedChange={(val) => {
                                setModuleNotifications(val);
                                persistSetting({ moduleNotifications: val });
                            }}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
