"use client";

import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Layers, Edit, CalendarDays, FileText, Map, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ModuleCard } from "@/components/module/module-card";
import { CollectionCard } from "@/components/collection/collection-card";
import { EditProfileDialog } from "@/components/settings/edit-profile-dialog";
import { ShareButton } from "@/components/shared/share-button";
import Link from "next/link";

export function ProfileClient() {
    const { data: profile, isLoading: isLoadingProfile } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const res = await fetch('/api/user/profile');
            if (res.status === 401 || res.status === 404) {
                window.location.href = "/login?error=SessionExpired";
                return null;
            }
            if (!res.ok) throw new Error('Failed to fetch profile');
            return await res.json();
        }
    });

    const { data: myModules = [], isLoading: isLoadingModules } = useQuery({
        queryKey: ['library-modules', 'created'],
        queryFn: async () => {
            const res = await fetch('/api/modules?role=created');
            if (!res.ok) return [];
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data?.items || []);
            return list.filter((m: any) => m.role === 'OWNER');
        }
    });

    const { data: myCollections = [], isLoading: isLoadingCollections } = useQuery({
        queryKey: ['library-collections'],
        queryFn: async () => {
            const res = await fetch('/api/collections?role=created');
            if (!res.ok) return [];
            const data = await res.json();
            return Array.isArray(data) ? data : (data?.items || []);
        }
    });

    const { data: myNotesPayload, isLoading: isLoadingNotes } = useQuery({
        queryKey: ['profile-notes'],
        queryFn: async () => {
            const res = await fetch('/api/notes?limit=100');
            if (!res.ok) throw new Error('Failed to fetch notes');
            return res.json();
        }
    });

    const myNotes = myNotesPayload?.items || [];

    if (isLoadingProfile) {
        return (
            <div className="space-y-6 max-w-5xl mx-auto">
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                    </div>
                </div>
                <Skeleton className="h-[200px] w-full" />
            </div>
        );
    }

    const statItems = [
        {
            title: "Modüller",
            value: profile?.stats?.modules || 0,
            icon: BookOpen,
            color: "text-indigo-400",
            bg: "bg-indigo-500/10",
        },
        {
            title: "Koleksiyonlar",
            value: profile?.stats?.collections || 0,
            icon: Layers,
            color: "text-sky-400",
            bg: "bg-sky-500/10",
        },
        {
            title: "Notlar",
            value: profile?.stats?.notes || 0,
            icon: FileText,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
        },
        {
            title: "Rotalar",
            value: profile?.stats?.journeys || 0,
            icon: Map,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
        },
        {
            title: "AI Çözümleri",
            value: profile?.stats?.solvedQuestions || 0,
            icon: Sparkles,
            color: "text-rose-400",
            bg: "bg-rose-500/10",
        },
    ];

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div className="flex items-center gap-4 sm:gap-6">
                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-background shadow-lg">
                        <AvatarImage src={profile?.image} />
                        <AvatarFallback className="text-xl sm:text-2xl bg-indigo-600 font-bold text-white">
                            {(profile?.name || profile?.handle || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                            {profile?.name || `@${profile?.handle || "kullanici"}`}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-300">
                            {profile?.handle && <span className="font-medium text-sm text-[#818cf8]">@{profile.handle}</span>}
                            {profile?.handle && profile?.createdAt && <span>•</span>}
                            {profile?.createdAt && (
                                <span className="flex items-center gap-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                    <CalendarDays className="h-3 w-3" />
                                    {new Date(profile.createdAt).toLocaleDateString("tr-TR")} tarihinde katıldı
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <EditProfileDialog
                        user={{ handle: profile?.handle, image: profile?.image }}
                        trigger={
                            <Button variant="outline" className="border-white/10 hover:bg-white/5">
                                <Edit className="h-4 w-4 mr-2" /> Profili Düzenle
                            </Button>
                        }
                    />
                    {profile?.handle && (
                        <ShareButton type="profile" id={profile.handle} title={`@${profile.handle} Profili`} />
                    )}
                </div>
            </div>

            {/* 5 Library Entities Stats — Akıcı Yatay Kaydırma (Mobil / Tablet / Masaüstü Paritesi) */}
            <div className="w-full">
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 sm:grid sm:grid-cols-3 lg:grid-cols-5">
                    {statItems.map((item) => (
                        <Card key={item.title} className="bg-[#121215] border-white/10 shrink-0 min-w-[130px] sm:min-w-0">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
                                <CardTitle className="text-xs font-medium text-[#a1a1aa]">{item.title}</CardTitle>
                                <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                            </CardHeader>
                            <CardContent className="p-3 pt-1">
                                <div className="text-xl md:text-2xl font-bold text-[#f4f4f5]">{item.value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="modules" className="w-full">
                <TabsList className="mb-4 w-full flex justify-start overflow-x-auto whitespace-nowrap h-auto p-1 pb-2 no-scrollbar">
                    <TabsTrigger value="modules" className="shrink-0">Üretimlerim ({myModules.length})</TabsTrigger>
                    <TabsTrigger value="collections" className="shrink-0">Koleksiyonlarım ({myCollections.length})</TabsTrigger>
                    <TabsTrigger value="notes" className="shrink-0">Notlarım ({myNotes.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="modules" className="space-y-4">
                    {isLoadingModules ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-[250px]" />)}
                        </div>
                    ) : myModules?.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border border-dashed border-white/10 rounded-xl">
                            Henüz modül oluşturmadınız.
                            <br />
                            <Button variant="link" asChild className="mt-2 text-indigo-400">
                                <Link href="/dashboard/create">Atölye'ye Git</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myModules?.map((item: any) => (
                                <ModuleCard key={item.moduleId} module={item.module} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="collections" className="space-y-4">
                    {isLoadingCollections ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-[250px]" />)}
                        </div>
                    ) : myCollections?.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border border-dashed border-white/10 rounded-xl">
                            Henüz koleksiyon oluşturmadınız.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myCollections?.map((item: any) => (
                                <CollectionCard key={item.collectionId} item={item} viewMode="grid" />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="notes" className="space-y-4">
                    {isLoadingNotes ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-[150px]" />)}
                        </div>
                    ) : myNotes?.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center">
                            <FileText className="h-10 w-10 text-muted-foreground opacity-50 mb-4" />
                            <p>Henüz not almadınız.</p>
                            <Button variant="link" asChild className="mt-2 text-indigo-400">
                                <Link href="/dashboard/create/manual-note">Not Yaz</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {myNotes?.map((note: any) => (
                                <Link href={`/dashboard/notes/${note.id}`} key={note.id} className="block group">
                                    <Card className="bg-[#121215] border-white/10 hover:border-indigo-500/50 transition-all hover:shadow-md cursor-pointer">
                                        <CardHeader className="p-4 pb-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <Badge variant="secondary" className="text-[10px] bg-white/5 border border-white/10">
                                                        {note.moduleId ? "Modül Notu" : "Serbest / AI Not"}
                                                    </Badge>
                                                    {note.visibility === "PUBLIC" && (
                                                        <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                                                            Herkese Açık
                                                        </Badge>
                                                    )}
                                                    {(() => {
                                                        try {
                                                            const parsed = JSON.parse(note.content);
                                                            if (parsed?.drawing || (Array.isArray(parsed) && parsed.some((b: any) => b.type === "drawing"))) {
                                                                return (
                                                                    <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30">
                                                                        ✏️ Çizim
                                                                    </Badge>
                                                                );
                                                            }
                                                        } catch {}
                                                        return null;
                                                    })()}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {new Date(note.updatedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <CardTitle className="text-sm mt-2 group-hover:text-indigo-400 transition-colors text-[#f4f4f5]">
                                                {note.title || "Adsız Not"}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            <p className="text-sm text-[#a1a1aa] line-clamp-3">
                                                {(() => {
                                                    try {
                                                        const parsed = JSON.parse(note.content);
                                                        if (Array.isArray(parsed)) {
                                                            return parsed
                                                                .map((b: any) => (Array.isArray(b.content) ? b.content.map((c: any) => c.text || "").join("") : ""))
                                                                .filter(Boolean)
                                                                .join(" ") || "...";
                                                        }
                                                        if (parsed && typeof parsed === 'object') {
                                                            return parsed.text || "...";
                                                        }
                                                    } catch { }
                                                    return note.content?.replace(/<[^>]*>?/gm, '') || "...";
                                                })()}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
