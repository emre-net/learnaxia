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
    Wallet
} from "lucide-react"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { WalletDialog } from "@/components/wallet/wallet-dialog"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname()

    const routes = [
        {
            label: "Kitaplık",
            icon: Library,
            href: "/dashboard",
            active: pathname === "/dashboard" || pathname.startsWith("/dashboard/modules"),
        },
        {
            label: "Oluştur",
            icon: PlusCircle,
            href: "/dashboard/create",
            active: pathname === "/dashboard/create",
        },
        {
            label: "Analiz",
            icon: BarChart2,
            href: "/dashboard/analytics",
            active: pathname === "/dashboard/analytics",
        },
        {
            label: "Jetonlar",
            icon: Wallet,
            href: "/dashboard/wallet",
            active: pathname === "/dashboard/wallet",
        },
        {
            label: "Ayarlar",
            icon: Settings,
            href: "/dashboard/settings",
            active: pathname === "/dashboard/settings",
        },
    ]

    return (
        <div className={cn("pb-12", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <div className="flex items-center pl-4 mb-10">
                        <BrainCircuit className="h-8 w-8 text-primary mr-2" />
                        <h2 className="text-2xl font-bold tracking-tight">Learnaxia</h2>
                    </div>
                    <div className="space-y-1">
                        {routes.map((route) => {
                            if (route.label === "Jetonlar") {
                                return (
                                    <div key={route.href} className="px-0">
                                        <div className="w-full justify-start relative">
                                            <div className="absolute left-2 top-2 z-10 pointer-events-none">
                                                {/* Optional: Icon overlay or styling */}
                                            </div>
                                            <WalletDialog />
                                            {/* Note: WalletDialog has its own trigger button, 
                                                we might need to styling it to look like a sidebar item 
                                                OR we update WalletDialog to accept a custom trigger.
                                                For now, let's just place it here.
                                            */}
                                        </div>
                                    </div>
                                )
                            }
                            return (
                                <Button
                                    key={route.href}
                                    variant={route.active ? "secondary" : "ghost"}
                                    className={cn(
                                        "w-full justify-start",
                                        route.active && "bg-secondary"
                                    )}
                                    asChild
                                >
                                    <Link href={route.href}>
                                        <route.icon className="mr-2 h-5 w-5" />
                                        {route.label}
                                    </Link>
                                </Button>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4">
                <div className="px-3 py-2">
                    <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => { }}>
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
