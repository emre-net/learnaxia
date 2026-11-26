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
    Compass,
    User,
    LayoutDashboard,
    Trophy,
    BarChart3
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

function UserCard() {
    const { data: session } = useSession()
    const userName = (session?.user as any)?.handle || session?.user?.name || session?.user?.email?.split('@')[0] || 'Kullanıcı'
    const initials = userName.slice(0, 2).toUpperCase()
    const gradients = [
        'from-sky-500 to-blue-600',
        'from-cyan-500 to-sky-600',
        'from-emerald-500 to-cyan-600',
        'from-amber-500 to-orange-600',
        'from-violet-500 to-indigo-600',
    ]
    const gradient = gradients[(userName.charCodeAt(0) || 0) % gradients.length]

    return (
        <div className="p-3 rounded-2xl bg-[#121215] border border-white/[0.08] flex items-center gap-3 group">
            <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-sm font-bold text-zinc-950 shrink-0', gradient)}>
                {initials}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-100 truncate">{userName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[11px] text-zinc-400 font-medium">Aktif</span>
                </div>
            </div>

            <button
                onClick={() => signOut({ callbackUrl: "/" })}
                title="Çıkış Yap"
                className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 lg:opacity-0 lg:group-hover:opacity-100"
            >
                <LogOut className="w-4 h-4" />
            </button>
        </div>
    )
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    onNavigate?: () => void
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
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
            label: "Analiz",
            icon: BarChart3,
            href: "/dashboard/analytics",
            active: pathname === "/dashboard/analytics",
        },
        {
            label: "Sıralama",
            icon: Trophy,
            href: "/dashboard/leaderboard",
            active: pathname === "/dashboard/leaderboard",
        },
        {
            label: t('sidebar.profile'),
            icon: User,
            href: "/dashboard/profile",
            active: pathname === "/dashboard/profile",
        },
    ]

    const isCreateActive = pathname.startsWith("/dashboard/create")

    return (
        <div className={cn("pb-6 h-full bg-[#09090b] text-zinc-100 border-r border-white/[0.07]", className)}>
            <div className="space-y-4 py-4 flex flex-col h-full">
                <div className="px-4 py-2">
                    <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-2.5 pl-1 mb-7">
                        <Image
                            src="/logo.png"
                            alt="Learnaxia Logo"
                            width={40}
                            height={40}
                            className="h-9 w-9 object-contain shrink-0"
                        />
                        <span className="text-lg font-bold tracking-tight text-zinc-100">
                            Learnaxia
                        </span>
                    </Link>

                    {/* Atölye CTA */}
                    <div className="mb-6">
                        <Link href="/dashboard/create" onClick={onNavigate}>
                            <div className={cn(
                                "relative group rounded-2xl p-3 flex items-center gap-3 cursor-pointer transition-all duration-200 border",
                                isCreateActive
                                    ? "bg-sky-500/15 border-sky-400/50 text-sky-300"
                                    : "bg-[#121215] border-white/[0.08] hover:border-sky-400/40 hover:bg-[#18181b]"
                            )}>
                                <div className="h-9 w-9 rounded-xl bg-sky-500 text-zinc-950 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                                    <PlusCircle className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-semibold text-zinc-100 truncate">{t('sidebar.workshop')}</span>
                                    <span className="text-[11px] text-zinc-400 truncate">{t('sidebar.buildSystem')}</span>
                                </div>
                            </div>
                        </Link>
                    </div>

                    <div className="space-y-1">
                        {routes.map((route) => (
                            <Link
                                key={route.href}
                                href={route.href as any}
                                onClick={onNavigate}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full",
                                    route.active
                                        ? "bg-[#18181b] text-zinc-100 border border-white/[0.08]"
                                        : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
                                )}
                            >
                                <route.icon className={cn(
                                    "h-4.5 w-4.5 transition-colors",
                                    route.active ? "text-sky-400" : "text-zinc-500"
                                )} />
                                {route.label}
                                {route.active && (
                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-400" />
                                )}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="mt-auto px-4 pb-2">
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
                <Button variant="ghost" size="icon" className="lg:hidden text-zinc-200 hover:bg-zinc-800/70" aria-label="Menü">
                    <Menu className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-[#09090b] border-r border-white/[0.08] w-72">
                <Sidebar className="h-full border-r-0" onNavigate={() => setOpen(false)} />
            </SheetContent>
        </Sheet>
    )
}
