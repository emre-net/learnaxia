"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Library,
    PlusCircle,
    LogOut,
    Menu,
    BrainCircuit,
    Compass,
    User,
    LayoutDashboard
} from "lucide-react"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname()

    const routes = [
        {
            label: "Akış",
            icon: LayoutDashboard,
            href: "/dashboard",
            active: pathname === "/dashboard",
        },
        {
            label: "Keşfet",
            icon: Compass,
            href: "/dashboard/discover",
            active: pathname === "/dashboard/discover",
        },
        {
            label: "Kitaplık",
            icon: Library,
            href: "/dashboard/library",
            active: pathname === "/dashboard/library" || pathname.startsWith("/dashboard/modules"),
        },
        {
            label: "Profil",
            icon: User,
            href: "/dashboard/settings",
            active: pathname === "/dashboard/settings",
        },
    ]

    const isCreateActive = pathname.startsWith("/dashboard/create")

    return (
        <div className={cn("pb-12 h-full bg-gradient-to-b from-slate-900 to-black text-white border-r border-slate-800", className)}>
            <div className="space-y-4 py-4 flex flex-col h-full">
                <div className="px-4 py-2">
                    <div className="flex items-center pl-2 mb-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center mr-3 shadow-lg shadow-blue-500/20">
                            <BrainCircuit className="h-6 w-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                            Learnaxia
                        </h2>
                    </div>

                    {/* Oluştur — Featured CTA */}
                    <div className="mb-6">
                        <Link href="/dashboard/create">
                            <div className={cn(
                                "relative group rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all duration-300",
                                isCreateActive
                                    ? "bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-purple-500/30"
                                    : "bg-gradient-to-r from-violet-600/80 to-purple-600/80 hover:from-violet-600 hover:to-purple-600 hover:shadow-lg hover:shadow-purple-500/25"
                            )}>
                                <div className="h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-sm">
                                    <PlusCircle className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-white">Oluştur</span>
                                    <span className="text-[10px] text-white/60">Yeni modül veya koleksiyon</span>
                                </div>
                            </div>
                        </Link>
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
                        Çıkış Yap
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
