"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Library,
    Compass,
    User,
    Sparkles
} from "lucide-react"
import { motion } from "framer-motion"

export function MobileBottomNav() {
    const pathname = usePathname()

    const routes = [
        {
            icon: LayoutDashboard,
            href: "/dashboard",
            label: "Ana Sayfa",
            active: pathname === "/dashboard",
        },
        {
            icon: Library,
            href: "/dashboard/library",
            label: "Kütüphane",
            active: pathname === "/dashboard/library" || pathname.startsWith("/dashboard/modules"),
        },
        {
            icon: Sparkles, // Central Create / AI Action
            href: "/dashboard/create",
            label: "Üret",
            active: pathname.startsWith("/dashboard/create"),
            primary: true
        },
        {
            icon: Compass,
            href: "/dashboard/discover",
            label: "Keşfet",
            active: pathname === "/dashboard/discover",
        },
        {
            icon: User,
            href: "/dashboard/profile",
            label: "Profil",
            active: pathname === "/dashboard/profile",
        },
    ]

    return (
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg">
            <nav className="bg-[#121215]/95 backdrop-blur-xl rounded-[2.5rem] px-5 py-3 flex items-center justify-between border border-white/10 shadow-2xl shadow-black/60">
                {routes.map((route) => {
                    const isActive = route.active
                    const Icon = route.icon

                    if (route.primary) {
                        return (
                            <Link
                                key={route.href}
                                href={route.href}
                                aria-label={route.label}
                                className="relative flex items-center justify-center -top-7 w-14 h-14 rounded-full bg-[#6366f1] text-white shadow-xl shadow-indigo-500/40 border-4 border-[#09090b] group active:scale-90 transition-transform"
                            >
                                <Icon className="h-6 w-6 text-white group-hover:rotate-12 transition-transform" />
                            </Link>
                        )
                    }

                    return (
                        <Link
                            key={route.href}
                            href={route.href}
                            aria-label={route.label}
                            className="flex flex-col items-center justify-center py-1 px-3 relative group active:scale-95 transition-all"
                        >
                            {isActive && (
                                <motion.div 
                                    layoutId="nav-active"
                                    className="absolute inset-0 bg-indigo-500/15 rounded-2xl -z-10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
                                />
                            )}
                            <Icon
                                className={cn(
                                    "h-6 w-6 transition-colors duration-200",
                                    isActive ? "text-[#818cf8]" : "text-[#71717a] group-hover:text-[#f4f4f5]"
                                )}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            {isActive && (
                                <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#6366f1]" />
                            )}
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
