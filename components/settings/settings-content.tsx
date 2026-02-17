"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { User, Bell, Shield, BarChart2, Loader2, Clock, BookOpen, Activity, Coins, TrendingUp, TrendingDown, History } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DailyActivityChart } from "@/components/analytics/daily-activity-chart";
import { ModulePerformanceList } from "@/components/analytics/module-performance-list";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface SettingsContentProps {
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        handle?: string | null;
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

    // Get tab from URL or default to "general"
    const defaultTab = (searchParams.get("tab") as Tab) || "general";
    const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

    // Sync state with URL if URL changes externally (e.g. back button)
    useEffect(() => {
        const tabFromUrl = searchParams.get("tab") as Tab;
        if (tabFromUrl && tabFromUrl !== activeTab) {
            setActiveTab(tabFromUrl);
        }
    }, [searchParams, activeTab]);

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        // Create new URLSearchParams object to update the URL
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const [name, setName] = useState(user.name || "");
    const [handle, setHandle] = useState(user.handle || "");
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, handle }),
            });

            if (!res.ok) {
                const error = await res.text();
                throw new Error(error);
            }

            toast({ title: "Başarılı", description: "Profiliniz güncellendi." });
            router.refresh();
        } catch (error: any) {
            toast({
                title: "Hata",
                description: error.message || "Bir hata oluştu.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [walletData, setWalletData] = useState<WalletData | null>(null);
    const [walletLoading, setWalletLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (activeTab === "analytics" && !analyticsData) {
            setAnalyticsLoading(true);
            fetch("/api/analytics")
                .then((res) => {
                    if (!res.ok) throw new Error("Failed");
                    return res.json();
                })
                .then(setAnalyticsData)
                .catch(() => {
                    toast({ title: "Hata", description: "İstatistik verileri yüklenemedi.", variant: "destructive" });
                })
                .finally(() => setAnalyticsLoading(false));
        }
    }, [activeTab, analyticsData, toast]);

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
                                <CardDescription>Başkalarının sizi nasıl göreceğini güncelleyin.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="handle">Kullanıcı Adı (Benzersiz)</Label>
                                    <Input
                                        id="handle"
                                        placeholder="Kullanıcı adınız"
                                        value={handle}
                                        onChange={(e) => setHandle(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Benzersiz olmalıdır. Harf, rakam ve alt çizgi içerebilir.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Görünen İsim (Ad Soyad)</Label>
                                    <Input
                                        id="name"
                                        placeholder="Adınız"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">E-posta</Label>
                                    <Input id="email" defaultValue={user.email || ""} disabled />
                                    <p className="text-xs text-muted-foreground">E-posta adresi değiştirilemez.</p>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Kaydet
                                    </Button>
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
                                                        <div key={tx.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-sm font-medium">{tx.description || tx.type}</span>
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
                            <p className="text-muted-foreground">Bildirim ayarları yakında eklenecek.</p>
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
    );
}
