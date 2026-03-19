
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSettingsStore } from "@/stores/settings-store";
import { useTranslation } from "@/lib/i18n/i18n";

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

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('settings.preferences.title')}</CardTitle>
                <CardDescription>{t('settings.preferences.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="language">{t('settings.preferences.languageLabel')}</Label>
                    <Select value={language} onValueChange={onLanguageChange}>
                        <SelectTrigger id="language">
                            <SelectValue placeholder={t('settings.preferences.languagePlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="tr">Türkçe 🇹🇷</SelectItem>
                            <SelectItem value="en">English 🇬🇧</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                    <div className="space-y-0.5">
                        <Label className="text-base">{t('settings.preferences.soundLabel')}</Label>
                        <p className="text-xs text-muted-foreground">{t('settings.preferences.soundDesc')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch checked={soundEnabled} onCheckedChange={onSoundEnabledChange} />
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                    <div className="space-y-0.5">
                        <Label className="text-base">{t('settings.preferences.focusLabel')}</Label>
                        <p className="text-xs text-muted-foreground">{t('settings.preferences.focusDesc')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={useSettingsStore(s => s.showStudyTimer)}
                            onCheckedChange={useSettingsStore(s => s.setShowStudyTimer)}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                        <div className="space-y-0.5">
                            <Label className="text-base">{t('settings.preferences.emailLabel')}</Label>
                            <p className="text-xs text-muted-foreground">{t('settings.preferences.emailDesc')}</p>
                        </div>
                        <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                        <div className="space-y-0.5">
                            <Label className="text-base">{t('settings.preferences.inAppLabel')}</Label>
                            <p className="text-xs text-muted-foreground">{t('settings.preferences.inAppDesc')}</p>
                        </div>
                        <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                        <div className="space-y-0.5">
                            <Label className="text-base">{t('settings.preferences.moduleLabel')}</Label>
                            <p className="text-xs text-muted-foreground">{t('settings.preferences.moduleDesc')}</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
