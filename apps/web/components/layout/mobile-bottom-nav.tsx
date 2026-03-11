"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/i18n"
import {
    LayoutDashboard,
    Library,
    Compass,
    User
} from "lucide-react"

export function MobileBottomNav() {
    const pathname = usePathname()
    const { t } = useTranslation()

    const routes = [
        {
            label: "Home", // Will use translations if available, or just keep icon
            icon: LayoutDashboard,
            href: "/dashboard",
            active: pathname === "/dashboard",
        },
        {
            label: "Library",
            icon: Library,
            href: "/dashboard/library",
            active: pathname === "/dashboard/library" || pathname.startsWith("/dashboard/modules") || pathname.startsWith("/dashboard/collections"),
        },
        {
            label: "Explore",
            icon: Compass,
            href: "/dashboard/discover",
            active: pathname === "/dashboard/discover",
        },
        {
            label: "Profile",
            icon: User,
            href: "/dashboard/settings",
            active: pathname === "/dashboard/settings",
        },
    ]

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-md border-t border-indigo-500/15 pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-around h-16 px-2">
                {routes.map((route) => {
                    const isActive = route.active
                    return (
                        <Link
                            key={route.href}
                            href={route.href}
                            className="flex flex-col items-center justify-center w-full h-full relative"
                        >
                            {/* Active Tab Highlight Background */}
                            {isActive && (
                                <div className="absolute inset-0 m-auto w-12 h-12 bg-indigo-500/10 rounded-xl -z-10" />
                            )}

                            <route.icon
                                className={cn(
                                    "h-6 w-6 transition-all duration-200",
                                    isActive ? "text-indigo-400" : "text-slate-500"
                                )}
                                strokeWidth={isActive ? 2.5 : 2}
                            />

                            {/* Active Tab Indicator Dot (Optional addition for flair) */}
                            {isActive && (
                                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-400" />
                            )}
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
