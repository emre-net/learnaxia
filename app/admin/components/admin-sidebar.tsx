"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Layers,
    Settings,
    LogOut,
    ShieldCheck,
    Database,
    Activity,
    Terminal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

const menuItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Modules", href: "/admin/modules", icon: Layers },
    { name: "System Logs", href: "/admin/system/logs", icon: Terminal },
    { name: "System Health", href: "/admin/system", icon: Activity },
    { name: "DB Tools", href: "/admin/tools", icon: Database },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl flex flex-col">
            <div className="p-6 flex items-center gap-3 border-b border-slate-800">
                <div className="p-2 bg-indigo-500 rounded-lg">
                    <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight">Admin<span className="text-indigo-400">Hub</span></span>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                                isActive ? "text-indigo-400" : "text-slate-500"
                            )} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Exit Admin</span>
                </button>
            </div>
        </aside>
    );
}
