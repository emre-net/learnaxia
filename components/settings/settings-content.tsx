
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { User, BarChart2, Pencil, Coins, SeparatorHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useSettingsStore } from "@/stores/settings-store";
import { Separator } from "@/components/ui/separator";

// Sub-components
import { ProfileHeader } from "./profile-header";
import { AccountSection } from "./account-section";
import { SystemPreferences } from "./system-preferences";
import { WalletSection } from "./wallet-section";
import { AnalyticsSection } from "./analytics-section";

interface SettingsContentProps {
    user: {
        email?: string | null;
        image?: string | null;
        handle?: string | null;
        language?: string | null;
    };
}

type Tab = "account" | "wallet" | "analytics" | "settings";

export function SettingsContent({ user }: SettingsContentProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();

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
    const [walletData, setWalletData] = useState<any>(null);
    const [walletLoading, setWalletLoading] = useState(false);

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

    useEffect(() => {
        if (activeTab === "wallet" && !walletData) {
            setWalletLoading(true);
            fetch("/api/wallet")
                .then((res) => res.ok ? res.json() : Promise.reject())
                .then(setWalletData)
                .catch(() => {
                    toast({ title: "Hata", description: "Cüzdan verileri yüklenemedi.", variant: "destructive" });
                })
                .finally(() => setWalletLoading(false));
        }
    }, [activeTab, walletData, toast]);

    const tabs: { id: Tab; label: string; icon: any }[] = [
        { id: "account", label: "Profil", icon: User },
        { id: "settings", label: "Ayarlar", icon: Pencil },
        { id: "analytics", label: "İstatistikler", icon: BarChart2 },
        { id: "wallet", label: "Cüzdan", icon: Coins },
    ];

    return (
        <div className="space-y-6">
            <ProfileHeader user={user} analyticsData={analyticsData} />

            {/* Spacer for floating header */}
            <div className="h-16 md:h-20"></div>

            {/* Mobile Stats Summary View */}
            <div className="lg:hidden grid grid-cols-1 md:grid-cols-3 gap-4 py-4 px-6 border-y bg-muted/20 rounded-xl mx-6">
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Başarı</span>
                    <span className="text-xl font-black text-blue-500">
                        {analyticsData?.stats ? `%${analyticsData.stats.globalAccuracy}` : "--"}
                    </span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Soru</span>
                    <span className="text-xl font-black text-purple-500">
                        {analyticsData?.stats?.totalSolved ?? "--"}
                    </span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Süre</span>
                    <span className="text-xl font-black text-emerald-500">
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
                    {activeTab === "wallet" && <WalletSection data={walletData} loading={walletLoading} />}
                    {activeTab === "analytics" && <AnalyticsSection data={analyticsData} loading={analyticsLoading} />}
                </div>
            </div>
        </div>
    );
}
