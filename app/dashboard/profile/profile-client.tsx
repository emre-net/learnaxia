
"use client";

import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Layers, Edit, CalendarDays, Share2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ModuleCard } from "@/components/module/module-card";
import { CollectionCard } from "@/components/collection/collection-card";
import { EditProfileDialog } from "@/components/settings/edit-profile-dialog"; // Reuse existing
import Link from "next/link";

export function ProfileClient() {
    const { data: profile, isLoading: isLoadingProfile } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const res = await fetch('/api/user/profile');
            if (!res.ok) throw new Error('Failed to fetch profile');
            const data = await res.json();
            console.log("Profile Data:", data); // Debugging handle
            return data;
        }
    });

    const { data: myModules, isLoading: isLoadingModules } = useQuery({
        queryKey: ['library-modules', 'created'], // Reuse or fetch specifically created
        queryFn: async () => {
            // We can reuse the existing /api/modules which returns library
            // But ideally we filter for "created" by me.
            // Client side filtering of the library response for now is efficient enough for MVP
            const res = await fetch('/api/modules');
            if (!res.ok) throw new Error('Failed to fetch modules');
            const data = await res.json();
            // Filter: Created by me (role OWNER and no sourceModule usually, or just sourceModule check)
            // Actually library returns everything. Let's filter by role='OWNER' and maybe checking if it's a fork?
            // For "Created" tab, usually means original content.
            return data.filter((m: any) => m.role === 'OWNER');
        }
    });

    const { data: myCollections, isLoading: isLoadingCollections } = useQuery({
        queryKey: ['library-collections'],
        queryFn: async () => {
            const res = await fetch('/api/collections');
            if (!res.ok) throw new Error('Failed to fetch collections');
            return res.json();
        }
    });

    if (isLoadingProfile) {
        return <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                </div>
            </div>
            <Skeleton className="h-[200px] w-full" />
        </div>
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                        <AvatarImage src={profile?.image} />
                        <AvatarFallback className="text-2xl">{profile?.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold">{profile?.name}</h1>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="font-medium">@{profile?.handle || "kullanici"}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-sm">
                                <CalendarDays className="h-3 w-3" />
                                {new Date(profile?.createdAt).toLocaleDateString("tr-TR")} tarihinde katıldı
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <EditProfileDialog
                        user={{ name: profile?.name, handle: profile?.handle, image: profile?.image }}
                        trigger={
                            <Button variant="outline">
                                <Edit className="h-4 w-4 mr-2" /> Profili Düzenle
                            </Button>
                        }
                    />
                    <Button variant="ghost" size="icon">
                        <Share2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Oluşturulan Modüller</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{profile?.stats?.modules || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Koleksiyonlar</CardTitle>
                        <Layers className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{profile?.stats?.collections || 0}</div>
                    </CardContent>
                </Card>
                {/* Placeholder for Study Streak or similar */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Başarı Puanı</CardTitle>
                        <Badge variant="secondary">Beta</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">-</div>
                        <p className="text-xs text-muted-foreground">Çok yakında...</p>
                    </CardContent>
                </Card>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="modules" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="modules">Modüllerim</TabsTrigger>
                    <TabsTrigger value="collections">Koleksiyonlarım</TabsTrigger>
                </TabsList>

                <TabsContent value="modules" className="space-y-4">
                    {isLoadingModules ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-[250px]" />)}
                        </div>
                    ) : myModules?.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                            Henüz modül oluşturmadınız.
                            <br />
                            <Button variant="link" asChild className="mt-2">
                                <Link href="/dashboard/create">Hemen Oluştur</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myModules?.map((item: any) => (
                                <ModuleCard key={item.moduleId} module={item.module} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="collections" className="space-y-4">
                    {isLoadingCollections ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-[250px]" />)}
                        </div>
                    ) : myCollections?.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                            Henüz koleksiyon oluşturmadınız.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myCollections?.map((item: any) => (
                                <CollectionCard key={item.collectionId} item={item} viewMode="grid" />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
