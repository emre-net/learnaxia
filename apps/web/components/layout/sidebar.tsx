"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
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
    Sparkles,
    PenTool,
    FileText,
    Camera,
    FolderPlus,
    Zap,
    Cpu
} from "lucide-react"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { motion, AnimatePresence } from "framer-motion"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname()
    const { t } = useTranslation()
    const [isHoveringAtölye, setIsHoveringAtölye] = useState(false)

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
    ]

    const isCreateActive = pathname.startsWith("/dashboard/create")

    const manualShortcuts = [
        { icon: PenTool, color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/50", label: t('sidebar.manualModule'), href: "/dashboard/create/manual" },
        { icon: FolderPlus, color: "text-indigo-400", bg: "bg-indigo-500/20", border: "border-indigo-500/50", label: t('sidebar.collection'), href: "/dashboard/collections/new" },
        { icon: FileText, color: "text-zinc-400", bg: "bg-zinc-500/20", border: "border-zinc-500/50", label: t('sidebar.writeNote'), href: "/dashboard/create/manual-note" },
    ]

    const aiShortcuts = [
        { icon: Sparkles, color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/50", label: t('sidebar.aiModule'), href: "/dashboard/create/ai" },
        { icon: Cpu, color: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500/50", label: t('sidebar.aiNote'), href: "/dashboard/create/ai-notes" },
        { icon: Camera, color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/50", label: t('sidebar.solvePhoto'), href: "/dashboard/create/solve-photo" },
    ]

    return (
        <div className={cn("pb-12 h-full bg-gradient-to-b from-slate-900 to-black text-white border-r border-slate-800", className)}>
            <div className="space-y-4 py-4 flex flex-col h-full">
                <div className="px-4 py-2">
                    <div className="flex items-center pl-2 mb-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center mr-3 shadow-lg shadow-blue-500/20 overflow-hidden">
                            <Image src="/logo.png" alt="Learnaxia Logo" width={28} height={28} className="h-7 w-7 object-contain" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                            Learnaxia
                        </h2>
                    </div>

                    {/* Atölye — Featured CTA with Branching Shortcuts */}
                    <div
                        className="mb-6 relative"
                        onMouseEnter={() => setIsHoveringAtölye(true)}
                        onMouseLeave={() => setIsHoveringAtölye(false)}
                    >
                        <Link href="/dashboard/create">
                            <div className={cn(
                                "relative group rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all duration-300 overflow-hidden z-20",
                                isCreateActive
                                    ? "bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-purple-500/30"
                                    : "bg-gradient-to-r from-violet-600/80 to-purple-600/80 hover:from-violet-600 hover:to-purple-600 hover:shadow-lg hover:shadow-purple-500/25"
                            )}>
                                {/* Shimmer Effect */}
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] transition-transform" />

                                <div className="h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-sm z-10 transition-all duration-500 group-hover:scale-110 group-hover:bg-white/20 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] border border-white/5">
                                    <motion.div
                                        animate={isHoveringAtölye ? { rotate: 90, scale: 1.1 } : { rotate: 0, scale: 1 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                                    >
                                        <PlusCircle className="h-5 w-5 text-white shadow-sm" />
                                    </motion.div>
                                </div>
                                <div className="flex flex-col z-10">
                                    <span className="text-sm font-semibold text-white tracking-wide group-hover:text-white transition-colors">{t('sidebar.workshop')}</span>
                                    <span className="text-[10px] text-white/70 font-medium group-hover:text-white/90 transition-colors">{t('sidebar.buildSystem')}</span>
                                </div>
                            </div>
                        </Link>

                        {/* Branching Shortcuts — Opening to the right like a data grid */}
                        <AnimatePresence>
                            {isHoveringAtölye && (
                                <motion.div
                                    className="absolute top-0 left-full ml-4 flex flex-col gap-3 z-50 pointer-events-auto"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                >
                                    {/* Manual Section Branch */}
                                    <div className="flex items-center gap-2 p-2 bg-slate-900/95 backdrop-blur-xl border border-blue-500/20 rounded-xl shadow-2xl shadow-blue-500/10">
                                        <div className="text-[9px] font-bold text-blue-500/70 border-r border-blue-500/20 pr-2 mr-1 uppercase tracking-tighter">{t('sidebar.produce')}</div>
                                        {manualShortcuts.map((shortcut, idx) => (
                                            <motion.div
                                                key={shortcut.label}
                                                initial={{ opacity: 0, scale: 0.8, x: -5 }}
                                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                                transition={{ delay: idx * 0.04 }}
                                            >
                                                <Link href={shortcut.href}>
                                                    <div className={cn(
                                                        "group/shortcut relative p-1.5 rounded-lg border transition-all duration-300 cursor-pointer hover:bg-white/5",
                                                        shortcut.bg,
                                                        shortcut.border,
                                                        "hover:scale-110 active:scale-95"
                                                    )}>
                                                        <shortcut.icon className={cn("h-4 w-4", shortcut.color)} />
                                                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover/shortcut:opacity-100 transition-opacity whitespace-nowrap z-50">
                                                            {shortcut.label}
                                                        </div>
                                                    </div>
                                                </Link>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* AI Section Branch */}
                                    <div className="flex items-center gap-2 p-2 bg-slate-900/95 backdrop-blur-xl border border-purple-500/20 rounded-xl shadow-2xl shadow-purple-500/10">
                                        <div className="text-[9px] font-bold text-purple-500/70 border-r border-purple-500/20 pr-2 mr-1 uppercase tracking-tighter">{t('sidebar.intelligence')}</div>
                                        {aiShortcuts.map((shortcut, idx) => (
                                            <motion.div
                                                key={shortcut.label}
                                                initial={{ opacity: 0, scale: 0.8, x: -5 }}
                                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                                transition={{ delay: 0.1 + idx * 0.04 }}
                                            >
                                                <Link href={shortcut.href}>
                                                    <div className={cn(
                                                        "group/shortcut relative p-1.5 rounded-lg border transition-all duration-300 cursor-pointer hover:bg-white/5",
                                                        shortcut.bg,
                                                        shortcut.border,
                                                        "hover:scale-110 active:scale-95"
                                                    )}>
                                                        <shortcut.icon className={cn("h-4 w-4", shortcut.color)} />
                                                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover/shortcut:opacity-100 transition-opacity whitespace-nowrap z-50">
                                                            {shortcut.label}
                                                        </div>
                                                    </div>
                                                </Link>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="space-y-1">
                        {routes.map((route) => (
                            <Button
                                key={route.href}
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200",
                                    route.active && "bg-slate-800 text-white border-l-4 border-blue-500 rounded-l-none pl-3 shadow-md shadow-black/20"
                                )}
                                asChild
                            >
                                <Link href={route.href}>
                                    <route.icon className={cn("mr-3 h-5 w-5", route.active ? "text-blue-400" : "text-slate-500")} />
                                    {route.label}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="mt-auto px-4 pb-4">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-950/30"
                        onClick={() => signOut({ callbackUrl: "/" })}
                    >
                        <LogOut className="mr-2 h-5 w-5" />
                        {t('sidebar.logout')}
                    </Button>
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
