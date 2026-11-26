"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
    BADGE_DEFINITIONS,
    BadgeKey,
    parseNoteContent,
} from "@learnaxia/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EditProfileDialog } from "@/components/settings/edit-profile-dialog";
import { ScoreCard } from "@/components/scoring/score-card";
import { BadgeList } from "@/components/scoring/badge-list";
import { TierBadge } from "@/components/scoring/tier-badge";
import { TypeIcon, getModuleTypeLabel } from "@/components/shared/type-icon";
import { RichMathText } from "@/components/shared/rich-math-text";
import { useTranslation } from "@/lib/i18n/i18n";
import {
    Award,
    BookOpen,
    Calendar,
    Compass,
    ExternalLink,
    Folder,
    Globe,
    Lock,
    PenTool,
    Settings,
    Sparkles,
    StickyNote,
} from "lucide-react";

const ALL_BADGE_KEYS = Object.keys(BADGE_DEFINITIONS) as BadgeKey[];

interface ProfileResponse {
    id: string;
    name?: string | null;
    handle?: string | null;
    email?: string | null;
    image?: string | null;
    createdAt?: string;
    stats?: {
        modules: number;
        collections: number;
        notes: number;
        journeys: number;
        solvedQuestions: number;
    };
}

interface ScoreSummary {
    momentum: { thisMonth: number; allTime: number };
    tier: {
        thisMonth: { key: string; label: string; emoji: string; color: string };
        allTime: { key: string; label: string; emoji: string; color: string };
    };
    badges: Array<{ key: BadgeKey }>;
}

export function ProfileClient() {
    const { language } = useTranslation();
    const isTr = language === "tr";
    const [activeTab, setActiveTab] = useState("modules");

    const { data: profile, isLoading: isLoadingProfile } = useQuery<ProfileResponse | null>({
        queryKey: ["profile"],
        queryFn: async () => {
            const res = await fetch("/api/user/profile");
            if (res.status === 401 || res.status === 404) {
                window.location.href = "/login?error=SessionExpired";
                return null;
            }
            if (!res.ok) throw new Error("Failed to fetch profile");
            return res.json();
        },
    });

    const { data: scoreData } = useQuery<ScoreSummary | null>({
        queryKey: ["scores-me"],
        queryFn: async () => {
            const res = await fetch("/api/scores/me");
            if (!res.ok) return null;
            return res.json();
        },
    });

    const { data: myModules = [], isLoading: isLoadingModules } = useQuery({
        queryKey: ["library-modules", "created"],
        queryFn: async () => {
            const res = await fetch("/api/modules?role=created");
            if (!res.ok) return [];
            const data = await res.json();
            return Array.isArray(data) ? data : (data?.items || []);
        },
    });

    const { data: myCollections = [], isLoading: isLoadingCollections } = useQuery({
        queryKey: ["library-collections", "created"],
        queryFn: async () => {
            const res = await fetch("/api/collections?role=created");
            if (!res.ok) return [];
            const data = await res.json();
            return Array.isArray(data) ? data : (data?.items || []);
        },
    });

    const { data: myNotes = [], isLoading: isLoadingNotes } = useQuery({
        queryKey: ["profile-notes"],
        queryFn: async () => {
            const res = await fetch("/api/notes?limit=100");
            if (!res.ok) return [];
            const data = await res.json();
            return Array.isArray(data) ? data : (data?.items || []);
        },
    });

    const { data: myJourneys = [], isLoading: isLoadingJourneys } = useQuery({
        queryKey: ["profile-journeys"],
        queryFn: async () => {
            const res = await fetch("/api/library/journeys");
            if (!res.ok) return [];
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        },
    });

    const { data: mySolvedQuestions = [], isLoading: isLoadingSolved } = useQuery({
        queryKey: ["profile-solved-questions"],
        queryFn: async () => {
            const res = await fetch("/api/solved-questions");
            if (!res.ok) return [];
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        },
    });

    if (isLoadingProfile) {
        return (
            <div className="space-y-6 p-4 md:p-8 max-w-6xl mx-auto">
                <Skeleton className="h-44 w-full rounded-2xl bg-[#121215]" />
                <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-48 w-full rounded-2xl bg-[#121215]" />
                    <Skeleton className="h-48 w-full rounded-2xl bg-[#121215]" />
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="p-8 text-center text-zinc-400">
                {isTr ? "Profil yüklenemedi. Lütfen tekrar giriş yapın." : "Failed to load profile. Please sign in again."}
            </div>
        );
    }

    const displayName = profile.name?.trim() || (profile.handle ? `@${profile.handle}` : "LearnAxia");
    const initials = (profile.name?.trim() || profile.handle || "LX").slice(0, 2).toUpperCase();
    const earnedKeys = (scoreData?.badges || []).map((b) => b.key).filter(Boolean);
    const activeTierKey = scoreData?.tier?.thisMonth?.key || "bronze";

    const statEntities = [
        {
            tab: "modules",
            label: isTr ? "Modüller" : "Modules",
            count: profile.stats?.modules ?? myModules.length,
            icon: BookOpen,
            accent: "text-sky-400 bg-sky-500/10",
        },
        {
            tab: "collections",
            label: isTr ? "Koleksiyonlar" : "Collections",
            count: profile.stats?.collections ?? myCollections.length,
            icon: Folder,
            accent: "text-indigo-400 bg-indigo-500/10",
        },
        {
            tab: "notes",
            label: isTr ? "Notlar" : "Notes",
            count: profile.stats?.notes ?? myNotes.length,
            icon: StickyNote,
            accent: "text-amber-400 bg-amber-500/10",
        },
        {
            tab: "journeys",
            label: isTr ? "Rotalar" : "Journeys",
            count: profile.stats?.journeys ?? myJourneys.length,
            icon: Compass,
            accent: "text-emerald-400 bg-emerald-500/10",
        },
        {
            tab: "solved",
            label: isTr ? "AI Çözümleri" : "AI Solutions",
            count: profile.stats?.solvedQuestions ?? mySolvedQuestions.length,
            icon: Sparkles,
            accent: "text-fuchsia-400 bg-fuchsia-500/10",
        },
    ];

    const joinedDate = profile.createdAt
        ? new Date(profile.createdAt).toLocaleDateString(isTr ? "tr-TR" : "en-US", {
              month: "long",
              year: "numeric",
          })
        : null;

    return (
        <div className="space-y-6 p-4 md:p-8 max-w-6xl mx-auto text-[#f4f4f5]">
            {/* Profile Hero Card */}
            <Card className="bg-[#121215] border-white/[0.06] rounded-2xl overflow-hidden shadow-none">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-4 sm:gap-5">
                            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border border-white/[0.08] bg-[#18181b]">
                                <AvatarImage src={profile.image || ""} alt={displayName} />
                                <AvatarFallback className="bg-[#18181b] text-sky-400 text-2xl font-bold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1.5 min-w-0">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <h1 className="text-2xl font-bold tracking-tight text-[#f4f4f5] truncate">
                                        {displayName}
                                    </h1>
                                    <TierBadge tierKey={activeTierKey} size="sm" showLabel />
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-400">
                                    {profile.handle && (
                                        <span className="font-medium text-sky-400">@{profile.handle}</span>
                                    )}
                                    {joinedDate && (
                                        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {isTr ? `Katılım: ${joinedDate}` : `Joined ${joinedDate}`}
                                        </span>
                                    )}
                                </div>
                                {profile.email && (
                                    <p className="text-xs text-zinc-500 truncate">{profile.email}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                            <EditProfileDialog
                                user={{
                                    name: profile.name,
                                    handle: profile.handle,
                                    image: profile.image,
                                }}
                            />
                            <Button
                                variant="outline"
                                asChild
                                className="bg-[#18181b] border-white/[0.08] text-zinc-200 hover:bg-zinc-800 hover:text-[#f4f4f5] rounded-xl"
                            >
                                <Link href="/dashboard/settings">
                                    <Settings className="h-4 w-4 mr-2" />
                                    {isTr ? "Ayarlar" : "Settings"}
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* 5 Library Entities Overview Bar */}
                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        {statEntities.map((item) => {
                            const Icon = item.icon;
                            const isSelected = activeTab === item.tab;
                            return (
                                <button
                                    key={item.tab}
                                    type="button"
                                    onClick={() => setActiveTab(item.tab)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                                        isSelected
                                            ? "bg-[#18181b] border-sky-500/40"
                                            : "bg-[#18181b]/70 border-white/[0.06] hover:bg-[#18181b]"
                                    }`}
                                >
                                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${item.accent}`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-lg font-bold text-[#f4f4f5] leading-tight">
                                            {item.count}
                                        </div>
                                        <div className="text-xs text-zinc-400 truncate">{item.label}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Momentum & Badges Parity Grid */}
            <div className="grid gap-4 lg:grid-cols-2">
                <ScoreCard />
                <Card className="bg-[#121215] border-white/[0.06] rounded-2xl shadow-none">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-semibold text-[#f4f4f5] flex items-center gap-2">
                            <Award className="h-4 w-4 text-sky-400" />
                            {isTr ? "Rozetler" : "Badges"}
                        </CardTitle>
                        <span className="text-xs text-zinc-400">
                            {earnedKeys.length} / {ALL_BADGE_KEYS.length}
                        </span>
                    </CardHeader>
                    <CardContent>
                        <BadgeList earnedKeys={earnedKeys} allKeys={ALL_BADGE_KEYS} size="md" />
                    </CardContent>
                </Card>
            </div>

            {/* 5 Library Entities Tabs (Fluid Horizontal Scrollable Track) */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <div className="overflow-x-auto pb-1">
                    <TabsList className="inline-flex w-max bg-[#121215] border border-white/[0.06] p-1 rounded-xl gap-1">
                        <TabsTrigger
                            value="modules"
                            className="rounded-lg px-3.5 py-2 text-xs sm:text-sm data-[state=active]:bg-[#18181b] data-[state=active]:text-sky-400 text-zinc-400 whitespace-nowrap"
                        >
                            {isTr ? "Modüllerim" : "Modules"} ({myModules.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="collections"
                            className="rounded-lg px-3.5 py-2 text-xs sm:text-sm data-[state=active]:bg-[#18181b] data-[state=active]:text-sky-400 text-zinc-400 whitespace-nowrap"
                        >
                            {isTr ? "Koleksiyonlarım" : "Collections"} ({myCollections.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="notes"
                            className="rounded-lg px-3.5 py-2 text-xs sm:text-sm data-[state=active]:bg-[#18181b] data-[state=active]:text-sky-400 text-zinc-400 whitespace-nowrap"
                        >
                            {isTr ? "Notlarım" : "Notes"} ({myNotes.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="journeys"
                            className="rounded-lg px-3.5 py-2 text-xs sm:text-sm data-[state=active]:bg-[#18181b] data-[state=active]:text-sky-400 text-zinc-400 whitespace-nowrap"
                        >
                            {isTr ? "Rotalarım" : "Journeys"} ({myJourneys.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="solved"
                            className="rounded-lg px-3.5 py-2 text-xs sm:text-sm data-[state=active]:bg-[#18181b] data-[state=active]:text-sky-400 text-zinc-400 whitespace-nowrap"
                        >
                            {isTr ? "AI Çözümleri" : "AI Solutions"} ({mySolvedQuestions.length})
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Modules Tab */}
                <TabsContent value="modules" className="mt-0">
                    {isLoadingModules ? (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-32 rounded-xl bg-[#121215]" />
                            ))}
                        </div>
                    ) : myModules.length === 0 ? (
                        <EmptyTabCard
                            message={isTr ? "Henüz oluşturulmuş modülün yok." : "No created modules yet."}
                            href="/dashboard/create"
                            cta={isTr ? "Modül Oluştur" : "Create Module"}
                        />
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {myModules.map((mod: any) => (
                                <Link
                                    key={mod.id}
                                    href={`/dashboard/modules/${mod.id}`}
                                    className="group block rounded-xl bg-[#121215] border border-white/[0.06] hover:border-sky-500/40 p-4 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <TypeIcon type={mod.type} size="sm" />
                                        <VisibilityBadge visibility={mod.visibility} isTr={isTr} />
                                    </div>
                                    <h3 className="font-semibold text-[#f4f4f5] line-clamp-1 group-hover:text-sky-400 transition-colors">
                                        {mod.title}
                                    </h3>
                                    <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                                        {getModuleTypeLabel(mod.type, language)}
                                        {mod.category ? ` • ${mod.category}` : ""}
                                    </p>
                                    <div className="mt-3 text-xs text-zinc-500">
                                        {mod._count?.items ?? mod.itemCount ?? 0} {isTr ? "içerik" : "items"}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Collections Tab */}
                <TabsContent value="collections" className="mt-0">
                    {isLoadingCollections ? (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-32 rounded-xl bg-[#121215]" />
                            ))}
                        </div>
                    ) : myCollections.length === 0 ? (
                        <EmptyTabCard
                            message={isTr ? "Henüz oluşturulmuş koleksiyonun yok." : "No collections created yet."}
                            href="/dashboard/collections/new"
                            cta={isTr ? "Koleksiyon Oluştur" : "Create Collection"}
                        />
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {myCollections.map((col: any) => (
                                <Link
                                    key={col.id}
                                    href={`/dashboard/collections/${col.id}`}
                                    className="group block rounded-xl bg-[#121215] border border-white/[0.06] hover:border-sky-500/40 p-4 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <TypeIcon type="COLLECTION" size="sm" />
                                        <VisibilityBadge visibility={col.visibility} isTr={isTr} />
                                    </div>
                                    <h3 className="font-semibold text-[#f4f4f5] line-clamp-1 group-hover:text-sky-400 transition-colors">
                                        {col.title}
                                    </h3>
                                    {col.category && (
                                        <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                                            {col.category}
                                            {col.subCategory ? ` / ${col.subCategory}` : ""}
                                        </p>
                                    )}
                                    <div className="mt-3 text-xs text-zinc-500">
                                        {col._count?.items ?? col.moduleCount ?? 0} {isTr ? "modül" : "modules"}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Notes Tab */}
                <TabsContent value="notes" className="mt-0">
                    {isLoadingNotes ? (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-32 rounded-xl bg-[#121215]" />
                            ))}
                        </div>
                    ) : myNotes.length === 0 ? (
                        <EmptyTabCard
                            message={isTr ? "Henüz oluşturulmuş notun yok." : "No notes yet."}
                            href="/dashboard/library?tab=notes"
                            cta={isTr ? "Notlara Git" : "Go to Notes"}
                        />
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {myNotes.map((note: any) => {
                                const parsed = parseNoteContent(note.content);
                                const snippet = parsed.plainText?.trim() || (parsed.drawing ? (isTr ? "El yazısı / çizim içeren not" : "Handwriting / drawing note") : "");
                                return (
                                    <Link
                                        key={note.id}
                                        href={`/dashboard/notes/${note.id}`}
                                        className="group block rounded-xl bg-[#121215] border border-white/[0.06] hover:border-sky-500/40 p-4 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <TypeIcon type="NOTE" size="sm" />
                                            <div className="flex items-center gap-1.5">
                                                {parsed.drawing && (
                                                    <Badge variant="outline" className="bg-[#18181b] border-white/[0.08] text-sky-400 text-[11px] gap-1">
                                                        <PenTool className="h-3 w-3" />
                                                        {isTr ? "Çizim" : "Drawing"}
                                                    </Badge>
                                                )}
                                                <VisibilityBadge visibility={note.visibility} isTr={isTr} />
                                            </div>
                                        </div>
                                        <h3 className="font-semibold text-[#f4f4f5] line-clamp-1 group-hover:text-sky-400 transition-colors">
                                            {note.title || (isTr ? "Başlıksız Not" : "Untitled Note")}
                                        </h3>
                                        <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 min-h-[2rem]">
                                            {snippet || (isTr ? "İçerik yok" : "Empty note")}
                                        </p>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* Journeys Tab */}
                <TabsContent value="journeys" className="mt-0">
                    {isLoadingJourneys ? (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-32 rounded-xl bg-[#121215]" />
                            ))}
                        </div>
                    ) : myJourneys.length === 0 ? (
                        <EmptyTabCard
                            message={isTr ? "Henüz öğrenme rotan bulunmuyor." : "No learning journeys yet."}
                            href="/dashboard/create"
                            cta={isTr ? "Rota Başlat" : "Start Journey"}
                        />
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {myJourneys.map((journey: any) => (
                                <Link
                                    key={journey.id}
                                    href={`/dashboard/learning/j/${journey.id}`}
                                    className="group block rounded-xl bg-[#121215] border border-white/[0.06] hover:border-sky-500/40 p-4 transition-colors"
                                >
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                                            <Compass className="h-4 w-4" />
                                        </div>
                                        <Badge variant="outline" className="bg-[#18181b] border-white/[0.08] text-zinc-300 text-[11px]">
                                            {journey.status === "COMPLETED"
                                                ? (isTr ? "Tamamlandı" : "Completed")
                                                : (isTr ? "Devam Ediyor" : "Active")}
                                        </Badge>
                                    </div>
                                    <h3 className="font-semibold text-[#f4f4f5] line-clamp-1 group-hover:text-sky-400 transition-colors">
                                        {journey.title || journey.topic}
                                    </h3>
                                    <p className="text-xs text-zinc-400 mt-1 line-clamp-1">{journey.topic}</p>
                                    <div className="mt-3 text-xs text-zinc-500 flex items-center justify-between">
                                        <span>{journey._count?.slides ?? 0} {isTr ? "slayt" : "slides"}</span>
                                        <ExternalLink className="h-3.5 w-3.5 text-zinc-500 group-hover:text-sky-400" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Solved Questions (AI Solutions) Tab */}
                <TabsContent value="solved" className="mt-0">
                    {isLoadingSolved ? (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-32 rounded-xl bg-[#121215]" />
                            ))}
                        </div>
                    ) : mySolvedQuestions.length === 0 ? (
                        <EmptyTabCard
                            message={isTr ? "Henüz çözülmüş AI sorun yok." : "No saved AI photo solutions yet."}
                            href="/dashboard/create/solve-photo"
                            cta={isTr ? "Soru Çözdür" : "Solve a Question"}
                        />
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {mySolvedQuestions.map((sq: any) => (
                                <Link
                                    key={sq.id}
                                    href={`/dashboard/create/solve-photo?id=${sq.id}`}
                                    className="group block rounded-xl bg-[#121215] border border-white/[0.06] hover:border-sky-500/40 p-4 transition-colors"
                                >
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <div className="h-8 w-8 rounded-lg bg-fuchsia-500/10 text-fuchsia-400 flex items-center justify-center">
                                            <Sparkles className="h-4 w-4" />
                                        </div>
                                        <span className="text-[11px] text-zinc-500">
                                            {new Date(sq.createdAt).toLocaleDateString(isTr ? "tr-TR" : "en-US")}
                                        </span>
                                    </div>
                                    {sq.imageUrl && (sq.imageUrl.startsWith("data:") || sq.imageUrl.startsWith("http")) && (
                                        <div className="relative mb-2.5 h-24 w-full rounded-lg overflow-hidden bg-[#18181b] border border-white/[0.06]">
                                            <Image
                                                unoptimized
                                                fill
                                                src={sq.imageUrl}
                                                alt="Soru"
                                                className="object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="text-sm font-medium text-[#f4f4f5] line-clamp-2 group-hover:text-sky-400 transition-colors">
                                        <RichMathText text={sq.questionText || ""} compact />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

function VisibilityBadge({ visibility, isTr }: { visibility?: string; isTr: boolean }) {
    const isPublic = visibility === "PUBLIC";
    return (
        <Badge
            variant="outline"
            className={`text-[11px] gap-1 border-white/[0.08] ${
                isPublic ? "bg-emerald-500/10 text-emerald-400" : "bg-[#18181b] text-zinc-400"
            }`}
        >
            {isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            {isPublic ? (isTr ? "Herkese Açık" : "Public") : (isTr ? "Özel" : "Private")}
        </Badge>
    );
}

function EmptyTabCard({ message, href, cta }: { message: string; href: string; cta: string }) {
    return (
        <Card className="bg-[#121215] border-white/[0.06] rounded-xl shadow-none">
            <CardContent className="py-10 flex flex-col items-center justify-center text-center gap-3">
                <p className="text-sm text-zinc-400">{message}</p>
                <Button asChild size="sm" className="bg-sky-500 hover:bg-sky-400 text-[#09090b] font-semibold rounded-lg">
                    <Link href={href}>{cta}</Link>
                </Button>
            </CardContent>
        </Card>
    );
}
