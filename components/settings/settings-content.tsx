"use client";

import { useState, useEffect } from "react";
import { User, Bell, Shield, BarChart2, Loader2, Clock, BookOpen, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DailyActivityChart } from "@/components/analytics/daily-activity-chart";
import { ModulePerformanceList } from "@/components/analytics/module-performance-list";
import { useToast } from "@/components/ui/use-toast";

interface SettingsContentProps {
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

type Tab = "general" | "notifications" | "security" | "analytics";

export function SettingsContent({ user }: SettingsContentProps) {
    const [activeTab, setActiveTab] = useState<Tab>("general");
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
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

    const tabs: { id: Tab; label: string; icon: typeof User }[] = [
        { id: "general", label: "Genel", icon: User },
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
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <tab.icon className="mr-2 h-4 w-4" /> {tab.label}
                    </Button>
                ))}
            </div>

            {/* Content Area */}
            <div className="md:col-span-3 space-y-6">
                {activeTab === "general" && (
                    <>
                        <Card>
                            <CardHeader>
                                <CardTitle>Profil Bilgileri</CardTitle>
                                <CardDescription>Başkalarının sizi nasıl göreceğini güncelleyin.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Ad Soyad</Label>
                                    <Input id="name" placeholder="Adınız" defaultValue={user.name || ""} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">E-posta</Label>
                                    <Input id="email" defaultValue={user.email || ""} disabled />
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
                            <CardContent>
                                <Button variant="outline">Şifre Değiştir</Button>
                            </CardContent>
                        </Card>
                    </>
                )}

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
