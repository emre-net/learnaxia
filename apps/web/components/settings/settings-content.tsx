
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { User, BarChart2, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useSettingsStore } from "@/stores/settings-store";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n/i18n";

// Sub-components
import { ProfileHeader } from "./profile-header";
import { AccountSection } from "./account-section";
import { SystemPreferences } from "./system-preferences";
import { AnalyticsSection } from "./analytics-section";

interface SettingsContentProps {
    user: {
        email?: string | null;
        image?: string | null;
        handle?: string | null;
        language?: string | null;
    };
}

type Tab = "account" | "analytics" | "settings";

export function SettingsContent({ user }: SettingsContentProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();
    const { t } = useTranslation();

    const defaultTab = (searchParams.get("tab") as Tab) || "account";
    const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

    useEffect(() => {
        const tabFromUrl = searchParams.get("tab") as Tab;
        if (tabFromUrl && activeTab !== tabFromUrl) {
            setActiveTab(tabFromUrl);
        }
    }, [searchParams, activeTab]);

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const [language, setLanguage] = useState(user.language || "tr");
    const { setLanguage: setStoreLanguage, soundEnabled, setSoundEnabled } = useSettingsStore();

    useEffect(() => {
        if (user.language) {
            setStoreLanguage(user.language as any);
        }
    }, [user.language, setStoreLanguage]);

    const saveLanguage = async (newLang: string) => {
        try {
            setStoreLanguage(newLang as any);
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ language: newLang }),
            });

            if (!res.ok) throw new Error("Dil güncellenemedi");

            toast({ title: "Başarılı", description: "Dil tercihi kaydedildi." });
            router.refresh();
        } catch (error: any) {
            toast({
                title: "Hata",
                description: "Dil tercihi kaydedilemedi.",
                variant: "destructive"
            });
        }
    };

    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    useEffect(() => {
        if (!analyticsData) {
            setAnalyticsLoading(true);
            fetch("/api/analytics")
                .then((res) => res.ok ? res.json() : Promise.reject())
                .then(setAnalyticsData)
                .catch(() => console.error("Failed to load profile stats"))
                .finally(() => setAnalyticsLoading(false));
        }
    }, [analyticsData]);

    const tabs: { id: Tab; label: string; icon: any }[] = [
        { id: "account", label: t('settings.profileTab'), icon: User },
        { id: "settings", label: t('settings.settingsTab'), icon: Pencil },
        { id: "analytics", label: t('settings.analyticsTab'), icon: BarChart2 },
    ];

    return (
        <div className="space-y-6">
            <ProfileHeader user={user} analyticsData={analyticsData} />

            {/* Spacer for floating header */}
            <div className="h-16 md:h-20"></div>

            {/* Mobile Stats Summary View */}
            <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4 py-4 px-6 border-y bg-muted/20 rounded-xl mx-6">
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{t('settings.questions')}</span>
                    <span className="text-xl font-black text-purple-500">
                        {analyticsData?.stats?.totalSolved ?? "--"}
                    </span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{t('settings.duration')}</span>
                    <span className="text-xl font-black text-cyan-400">
                        {analyticsData?.stats ? (
                            (analyticsData.stats.totalStudyMinutes ?? 0) > 60
                                ? `${Math.floor((analyticsData.stats.totalStudyMinutes ?? 0) / 60)}s`
                                : `${analyticsData.stats.totalStudyMinutes ?? 0}dk`
                        ) : "--"}
                    </span>
                </div>
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar Navigation */}
                <div className="md:col-span-1 space-y-1">
                    {tabs.map((tab) => (
                        <Button
                            key={tab.id}
                            variant={activeTab === tab.id ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => handleTabChange(tab.id)}
                        >
                            <tab.icon className="mr-2 h-4 w-4" /> {tab.label}
                        </Button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="md:col-span-3 space-y-6">
                    {activeTab === "account" && <AccountSection user={user} />}
                    {activeTab === "settings" && (
                        <SystemPreferences
                            language={language}
                            onLanguageChange={(val) => {
                                setLanguage(val);
                                saveLanguage(val);
                            }}
                            soundEnabled={soundEnabled}
                            onSoundEnabledChange={setSoundEnabled}
                        />
                    )}
                    {activeTab === "analytics" && <AnalyticsSection data={analyticsData} loading={analyticsLoading} />}

                    {/* ─── DANGER ZONE ────────────────────────────────────── */}
                    {activeTab === "account" && <DeleteAccountSection />}
                </div>
            </div>
        </div>
    );
}

// ─── Hesap Silme Bölümü ───────────────────────────────────────────────────
function DeleteAccountSection() {
    const [open, setOpen] = useState(false);
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleDelete = async () => {
        if (confirm !== "SİL") return;
        setLoading(true);
        try {
            const res = await fetch("/api/user/account", { method: "DELETE" });
            if (!res.ok) throw new Error((await res.json()).error);
            toast({ title: "Hesap silindi", description: "Güvenli şekilde çıkış yapılıyor..." });
            await signOut({ callbackUrl: "/" });
        } catch (err: any) {
            toast({ title: "Hata", description: err.message || "Hesap silinemedi.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-10">
            <Separator className="mb-8" />
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-bold text-red-400 mb-1">Tehlikeli Bölge</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Hesabınızı silerseniz tüm verileriniz (modüller, istatistikler, Momentum puanları)
                            30 gün içinde kalıcı olarak kaldırılır. Bu işlem geri alınamaz.
                        </p>

                        {!open ? (
                            <Button
                                variant="destructive"
                                size="sm"
                                className="gap-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                                onClick={() => setOpen(true)}
                            >
                                <Trash2 className="w-4 h-4" />
                                Hesabımı Sil
                            </Button>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm font-medium text-red-400">
                                    Onaylamak için aşağıya <strong>SİL</strong> yazın:
                                </p>
                                <input
                                    type="text"
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    placeholder="SİL"
                                    className="w-full max-w-xs px-4 py-2 rounded-lg bg-black/30 border border-red-500/30 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-red-500/60"
                                />
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => { setOpen(false); setConfirm(""); }}
                                    >
                                        İptal
                                    </Button>
                                    <Button
                                        size="sm"
                                        disabled={confirm !== "SİL" || loading}
                                        onClick={handleDelete}
                                        className="bg-red-600 hover:bg-red-500 text-white gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        {loading ? "Siliniyor..." : "Kalıcı Olarak Sil"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
