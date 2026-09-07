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
            active: pathname === "/dashboard",
        },
        {
            icon: Library,
            href: "/dashboard/library",
            active: pathname === "/dashboard/library" || pathname.startsWith("/dashboard/modules"),
        },
        {
            icon: Sparkles, // Central AI Action
            href: "/dashboard/create/ai-notes",
            active: pathname === "/dashboard/create/ai-notes",
            primary: true
        },
        {
            icon: Compass,
            href: "/dashboard/discover",
            active: pathname === "/dashboard/discover",
        },
        {
            icon: User,
            href: "/dashboard/settings",
            active: pathname === "/dashboard/settings",
        },
    ]

    return (
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md">
            <nav className="glass rounded-[2.5rem] px-4 py-3 sea-glow flex items-center justify-between border-white/10 shadow-2xl shadow-primary/10">
                {routes.map((route, i) => {
                    const isActive = route.active
                    const Icon = route.icon

                    if (route.primary) {
                        return (
                            <Link
                                key={route.href}
                                href={route.href}
                                className="relative flex items-center justify-center -top-8 w-14 h-14 rounded-full bg-gradient-to-tr from-primary via-secondary to-accent shadow-xl shadow-primary/40 border-4 border-background group active:scale-90 transition-transform"
                            >
                                <Icon className="h-6 w-6 text-white group-hover:rotate-12 transition-transform" />
                            </Link>
                        )
                    }

                    return (
                        <Link
                            key={route.href}
                            href={route.href}
                            className="flex flex-col items-center justify-center py-1 px-3 relative group active:scale-95 transition-all"
                        >
                            {isActive && (
                                <motion.div 
                                    layoutId="nav-active"
                                    className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-2xl -z-10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
                                />
                            )}
                            <Icon
                                className={cn(
                                    "h-6 w-6 transition-colors duration-200",
                                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                )}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            {isActive && (
                                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary" />
                            )}
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
