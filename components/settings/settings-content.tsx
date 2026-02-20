"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { User, Bell, Shield, BarChart2, Loader2, Clock, BookOpen, Activity, Coins, TrendingUp, TrendingDown, History, Pencil, Check, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DailyActivityChart } from "@/components/analytics/daily-activity-chart";
import { ModulePerformanceList } from "@/components/analytics/module-performance-list";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { EditProfileDialog } from "./edit-profile-dialog";
import { useSettingsStore } from "@/stores/settings-store";

interface SettingsContentProps {
    user: {
        email?: string | null;
        image?: string | null;
        handle?: string | null;
        language?: string | null;
    };
}

type Tab = "account" | "wallet" | "analytics" | "settings";

type Transaction = {
    id: string;
    amount: number;
    type: string;
    description: string | null;
    createdAt: string;
};

type WalletData = {
    balance: number;
    currency: string;
    history: Transaction[];
};

export function SettingsContent({ user }: SettingsContentProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

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

    const { toast } = useToast();



    const { setLanguage: setStoreLanguage, soundEnabled, setSoundEnabled } = useSettingsStore();

    // Sync Store with DB user language on mount
    useEffect(() => {
        if (user.language) {
            setStoreLanguage(user.language as any);
        }
    }, [user.language, setStoreLanguage]);

    const saveLanguage = async (newLang: string) => {
        try {
            setStoreLanguage(newLang as any); // Update global store immediately
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
    const [walletData, setWalletData] = useState<WalletData | null>(null);
    const [walletLoading, setWalletLoading] = useState(false);

    useEffect(() => {
        if (!analyticsData) {
            // Fetch analytics immediately for Profile Header stats
            setAnalyticsLoading(true);
            fetch("/api/analytics")
                .then((res) => {
                    if (!res.ok) throw new Error("Failed");
                    return res.json();
                })
                .then(setAnalyticsData)
                .catch(() => {
                    // Silent fail for header stats, or show toast only if truly needed
                    console.error("Failed to load profile stats");
                })
                .finally(() => setAnalyticsLoading(false));
        }
    }, [analyticsData]);

    useEffect(() => {
        if (activeTab === "wallet" && !walletData) {
            setWalletLoading(true);
            fetch("/api/wallet")
                .then((res) => {
                    if (!res.ok) throw new Error("Failed");
                    return res.json();
                })
                .then(setWalletData)
                .catch(() => {
                    toast({ title: "Hata", description: "Cüzdan verileri yüklenemedi.", variant: "destructive" });
                })
                .finally(() => setWalletLoading(false));
        }
    }, [activeTab, walletData, toast]);

    const tabs: { id: Tab; label: string; icon: typeof User }[] = [
        { id: "account", label: "Hesap", icon: User },
        { id: "settings", label: "Ayarlar", icon: Pencil },
        { id: "analytics", label: "İstatistikler", icon: BarChart2 },
        { id: "wallet", label: "Cüzdan", icon: Coins },
    ];

    return (
        <div className="space-y-6">
            {/* New Profile Header - Professional & Clean */}
            <div className="relative mb-8">
                {/* Cover Area */}
                <div className="h-48 w-full rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-white/10 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent"></div>
                </div>

                {/* Profile Info Card - Floating */}
                <div className="absolute -bottom-12 left-6 right-6 md:left-10 md:right-auto md:w-auto flex items-end gap-6">
                    <div className="relative group">
                        <Avatar className="h-32 w-32 border-4 border-background shadow-xl rounded-2xl">
                            <AvatarImage src={user.image || ""} alt={user.handle || ""} className="object-cover" />
                            <AvatarFallback className="text-4xl bg-muted rounded-2xl">
                                {user.handle?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                        </Avatar>
                    </div>

                    <div className="mb-4 flex-1 md:flex-none">
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">{user.handle}</h2>
                            <EditProfileDialog user={user} trigger={
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            } />
                        </div>
                        <p className="text-muted-foreground font-medium">@{user.handle || "kullanici"}</p>
                    </div>

                    {/* Desktop Stats - Moved higher & overlapping */}
                    <div className="hidden md:flex gap-8 mb-6 ml-12 bg-background/60 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-lg -translate-y-4">
                        <div className="flex flex-col">
                            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Modül Sayısı</span>
                            <span className="text-2xl font-bold text-foreground">
                                {analyticsData?.stats?.modulesStarted ?? "--"}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Çalışma Süresi</span>
                            <span className="text-2xl font-bold text-foreground">
                                {analyticsData ? (
                                    analyticsData.stats.totalStudyMinutes > 60
                                        ? `${Math.floor(analyticsData.stats.totalStudyMinutes / 60)}s ${(analyticsData.stats.totalStudyMinutes % 60)}dk`
                                        : `${analyticsData.stats.totalStudyMinutes}dk`
                                ) : "--"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Spacer for floating header */}
            <div className="h-16 md:h-20"></div>

            {/* Mobile Stats Row */}
            <div className="md:hidden flex justify-around py-4 border-y bg-muted/20">
                <div className="flex flex-col items-center">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Modül</span>
                    <span className="text-xl font-bold">
                        {analyticsData?.stats?.modulesStarted ?? "--"}
                    </span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Süre</span>
                    <span className="text-xl font-bold">
                        {analyticsData ? (
                            analyticsData.stats.totalStudyMinutes > 60
                                ? `${Math.floor(analyticsData.stats.totalStudyMinutes / 60)}s`
                                : `${analyticsData.stats.totalStudyMinutes}dk`
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
                    {/* === HESAP === */}
                    {activeTab === "account" && (
                        <>
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
                        </>
                    )}

                    {/* === AYARLAR === */}
                    {activeTab === "settings" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Sistem Ayarları</CardTitle>
                                <CardDescription>Dil ve uygulama tercihlerini yönetin.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="language">Dil Seçimi</Label>
                                    <Select
                                        value={language}
                                        onValueChange={(val) => {
                                            setLanguage(val);
                                            saveLanguage(val);
                                        }}
                                    >
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
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs h-7 px-2"
                                            onClick={() => {
                                                import("@/lib/audio").then(m => m.playStudySound('SUCCESS'));
                                            }}
                                        >
                                            Test Et
                                        </Button>
                                        <Switch
                                            checked={soundEnabled}
                                            onCheckedChange={setSoundEnabled}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Bildirimler</Label>
                                        <p className="text-xs text-muted-foreground">E-posta bildirimlerini aç/kapat.</p>
                                    </div>
                                    <Switch disabled />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
