"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Library,
    PlusCircle,
    BarChart2,
    Settings,
    LogOut,
    Menu,
    BrainCircuit,
    Wallet,
    Compass,
    Activity,
    User,
    LayoutDashboard
} from "lucide-react"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { WalletDialog } from "@/components/wallet/wallet-dialog"

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
            label: "Oluştur",
            icon: PlusCircle,
            href: "/dashboard/create",
            active: pathname.startsWith("/dashboard/create"),
        },
        {
            label: "Analiz",
            icon: BarChart2,
            href: "/dashboard/analytics",
            active: pathname === "/dashboard/analytics",
        },
        {
            label: "Profil",
            icon: User,
            href: "/dashboard/settings",
            active: pathname === "/dashboard/settings",
        },
    ]

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
                    {/* Unlimited Token Button Style */}
                    <div className="mb-6 relative group cursor-pointer">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-600 to-amber-600 rounded-lg blur opacity-50 group-hover:opacity-100 transition duration-200"></div>
                        <div className="relative bg-slate-950 rounded-lg p-1">
                            <WalletDialog />
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/30"
                        onClick={() => { /* Logout handled by auth usually via server action or separate button, keeping onClick placeholder */ }}
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
