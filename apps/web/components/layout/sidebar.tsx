"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n/i18n"
import {
    Library,
    PlusCircle,
    LogOut,
    Menu,
    BrainCircuit,
    Compass,
    User,
    LayoutDashboard,
    Trophy
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

// ─── User Card — Sidebar alt kısmı için kullanıcı özeti ──────────────────────
function UserCard() {
    const { data: session } = useSession()
    const userName = (session?.user as any)?.handle || session?.user?.name || session?.user?.email?.split('@')[0] || 'Kullanıcı'
    const initials = userName.slice(0, 2).toUpperCase()
    // İsme göre deterministik renk
    const gradients = [
        'from-blue-500 to-violet-600',
        'from-cyan-400 to-blue-500',
        'from-emerald-400 to-cyan-500',
        'from-amber-400 to-red-500',
        'from-violet-500 to-pink-500',
    ]
    const gradient = gradients[(userName.charCodeAt(0) || 0) % gradients.length]

    return (
        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center gap-3 group">
            {/* Gradient Avatar */}
            <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-sm font-black text-white shrink-0 shadow-lg', gradient)}>
                {initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{userName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
                    <span className="text-[10px] text-slate-400 font-medium">Aktif</span>
                </div>
            </div>

            {/* Logout */}
            <button
                onClick={() => signOut({ callbackUrl: "/" })}
                title="Çıkış Yap"
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 opacity-0 group-hover:opacity-100"
            >
                <LogOut className="w-4 h-4" />
            </button>
        </div>
    )
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname()
    const { t } = useTranslation()

    const routes = [
        {
            label: t('sidebar.dashboard'),
            icon: LayoutDashboard,
            href: "/dashboard",
            active: pathname === "/dashboard",
        },
        {
            label: t('sidebar.discover'),
            icon: Compass,
            href: "/dashboard/discover",
            active: pathname === "/dashboard/discover",
        },
        {
            label: t('sidebar.library'),
            icon: Library,
            href: "/dashboard/library",
            active: pathname === "/dashboard/library" || pathname.startsWith("/dashboard/modules"),
        },
        {
            label: t('sidebar.profile'),
            icon: User,
            href: "/dashboard/settings",
            active: pathname === "/dashboard/settings",
        },
        {
            label: "Liderboard",
            icon: Trophy,
            href: "/dashboard/leaderboard",
            active: pathname === "/dashboard/leaderboard",
        },
    ]

    const isCreateActive = pathname.startsWith("/dashboard/create")

    return (
        <div className={cn("pb-12 h-full bg-gradient-to-b from-slate-900 to-black text-white border-r border-slate-800", className)}>
            <div className="space-y-4 py-4 flex flex-col h-full">
                <div className="px-4 py-2">
                    <div className="flex items-center pl-1 mb-8 overflow-hidden">
                        <Image src="/logo.png" alt="Learnaxia Logo" width={56} height={56} className="h-14 w-14 object-contain shrink-0 drop-shadow-[0_0_10px_rgba(56,189,248,0.3)]" />
                        <span className="text-xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-500 ml-2 uppercase truncate">
                            Learnaxia
                        </span>
                    </div>

                    {/* Atölye — Featured CTA Button */}
                    <div className="mb-6">
                        <Link href="/dashboard/create">
                            <div className={cn(
                                "relative group rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all duration-300 overflow-hidden z-20",
                                isCreateActive
                                    ? "bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-purple-500/30 ring-1 ring-white/20"
                                    : "bg-gradient-to-r from-violet-600/80 to-purple-600/80 hover:from-violet-600 hover:to-purple-600 hover:shadow-lg hover:shadow-purple-500/25"
                            )}>
                                {/* Shimmer Effect */}
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] transition-transform" />

                                <div className="h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-sm z-10 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/20 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] border border-white/5">
                                    <PlusCircle className="h-5 w-5 text-white shadow-sm transition-transform duration-300 group-hover:rotate-90" />
                                </div>
                                <div className="flex flex-col z-10">
                                    <span className="text-sm font-semibold text-white tracking-wide group-hover:text-white transition-colors">{t('sidebar.workshop')}</span>
                                    <span className="text-[10px] text-white/70 font-medium group-hover:text-white/90 transition-colors">{t('sidebar.buildSystem')}</span>
                                </div>
                            </div>
                        </Link>
                    </div>

                    <div className="space-y-1">
                        {routes.map((route) => (
                        <Link key={route.href} href={route.href as any} className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full",
                            route.active
                                ? "bg-blue-500/10 text-blue-300 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.08)]"
                                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                        )}>
                            <route.icon className={cn(
                                "h-5 w-5 transition-all duration-200",
                                route.active ? "text-blue-400 scale-110" : "text-slate-500"
                            )} />
                            {route.label}
                            {route.active && (
                                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]" />
                            )}
                        </Link>
                    ))}
                    </div>
                </div>

                <div className="mt-auto px-4 pb-4">
                    {/* Gradient User Card */}
                    <UserCard />
                </div>
            </div>
        </div>
    )
}

export function MobileSidebar() {
    const [open, setOpen] = useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-background w-72">
                <Sidebar className="h-full border-r" />
            </SheetContent>
        </Sheet>
    )
}
