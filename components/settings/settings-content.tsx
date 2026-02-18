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

interface SettingsContentProps {
    user: {
        email?: string | null;
        image?: string | null;
        handle?: string | null;
        language?: string | null;
    };
}

type Tab = "general" | "wallet" | "analytics" | "notifications" | "security";

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

    const defaultTab = (searchParams.get("tab") as Tab) || "general";
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



    const saveLanguage = async (newLang: string) => {
        try {
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
        { id: "general", label: "Genel", icon: User },
        { id: "wallet", label: "Cüzdan", icon: Coins },
        { id: "analytics", label: "İstatistikler", icon: BarChart2 },
        { id: "notifications", label: "Bildirimler", icon: Bell },
        { id: "security", label: "Güvenlik", icon: Shield },
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

                    {/* Desktop Stats */}
                    <div className="hidden md:flex gap-8 mb-6 ml-12">
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
                    {/* === GENEL === */}
                    {activeTab === "general" && (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Profil Bilgileri</CardTitle>
                                    <CardDescription>Kişisel bilgilerinizi ve tercihlerinizi yönetin.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Handle (Username) - Read Only */}
                                    <div className="space-y-2">
                                        <Label htmlFor="handle">Kullanıcı Adı</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="handle"
                                                defaultValue={user.handle || ""}
                                                disabled
                                                className="bg-muted"
                                            />
                                            <EditProfileDialog user={user} trigger={
                                                <Button variant="ghost" size="icon">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            } />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Kullanıcı adınızı değiştirmek için kalem ikonuna veya yukarıdaki düzenle butonuna tıklayın.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">E-posta</Label>
                                            <Input id="email" defaultValue={user.email || ""} disabled className="bg-muted" />
                                            <p className="text-xs text-muted-foreground">E-posta adresi değiştirilemez.</p>
                                        </div>
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
                                            <p className="text-xs text-muted-foreground">Seçim otomatik olarak kaydedilir.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Şifre</CardTitle>
                                    <CardDescription>Hesap güvenliğinizi sağlamak için güçlü bir şifre kullanın.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="outline">Şifre Değiştir</Button>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* === CÜZDAN === */}
                    {activeTab === "wallet" && (
                        <>
                            {walletLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : walletData ? (
                                <>
                                    {/* Balance Card */}
                                    <Card className="border-yellow-500/20">
                                        <CardContent className="pt-6">
                                            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent rounded-xl">
                                                <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Mevcut Bakiye</span>
                                                <span className="text-5xl font-bold mt-2 bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-amber-500">
                                                    {walletData.balance}
                                                </span>
                                                <span className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 font-medium">
                                                    {walletData.currency} Token
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Transaction History */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <History className="h-4 w-4" /> İşlem Geçmişi
                                            </CardTitle>
                                            <CardDescription>Token kazanma ve harcama geçmişiniz.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {walletData.history.length === 0 ? (
                                                <p className="text-center text-sm text-muted-foreground py-8">Henüz işlem yok.</p>
                                            ) : (
                                                <ScrollArea className="h-[300px]">
                                                    <div className="space-y-3">
                                                        {walletData.history.map((tx) => (
                                                            <div key={tx.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors gap-3">
                                                                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                                                    <span className="text-sm font-medium truncate">{tx.description || tx.type}</span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {new Date(tx.createdAt).toLocaleDateString("tr-TR")}
                                                                    </span>
                                                                </div>
                                                                <span className={cn(
                                                                    "font-bold flex items-center text-sm",
                                                                    tx.amount > 0 ? "text-green-500" : "text-red-500"
                                                                )}>
                                                                    {tx.amount > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                                                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                            )}
                                        </CardContent>
                                    </Card>
                                </>
                            ) : (
                                <Card>
                                    <CardContent className="flex items-center justify-center py-12">
                                        <p className="text-muted-foreground">Cüzdan verisi bulunamadı.</p>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}

                    {/* === İSTATİSTİKLER === */}
                    {activeTab === "analytics" && (
                        <>
                            {analyticsLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : analyticsData ? (
                                <>
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Toplam Çalışma Süresi</CardTitle>
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{analyticsData.stats.totalStudyMinutes}dk</div>
                                                <p className="text-xs text-muted-foreground">Toplam öğrenme süresi.</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Başlanan Modüller</CardTitle>
                                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{analyticsData.stats.modulesStarted}</div>
                                                <p className="text-xs text-muted-foreground">Kütüphanenizdeki aktif modüller.</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Günlük Seri</CardTitle>
                                                <Activity className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">--</div>
                                                <p className="text-xs text-muted-foreground">Yakında...</p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                                        <div className="col-span-4">
                                            <DailyActivityChart data={analyticsData.dailyActivity} />
                                        </div>
                                        <div className="col-span-3">
                                            <ModulePerformanceList data={analyticsData.moduleStats} />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <Card>
                                    <CardContent className="flex items-center justify-center py-12">
                                        <p className="text-muted-foreground">Henüz istatistik verisi yok.</p>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}

                    {/* === BİLDİRİMLER === */}
                    {activeTab === "notifications" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Bildirimler</CardTitle>
                                <CardDescription>Bildirim tercihlerinizi yönetin.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">E-posta Bildirimleri</Label>
                                        <p className="text-xs text-muted-foreground">Önemli güncellemeler hakkında e-posta al.</p>
                                    </div>
                                    <Switch disabled />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* === GÜVENLİK === */}
                    {activeTab === "security" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Güvenlik</CardTitle>
                                <CardDescription>Hesap güvenlik ayarlarınızı yönetin.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Güvenlik ayarları yakında eklenecek.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
