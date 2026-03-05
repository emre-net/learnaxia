import prisma from "@/lib/prisma";
import {
    Users,
    Layers,
    CheckCircle2,
    Clock,
    TrendingUp,
    AlertCircle,
    Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDictionary } from "@/lib/i18n/dictionaries"; // Server component logic

export default async function AdminDashboardPage() {
    const dict = getDictionary('tr'); // Default to TR for admin panel as requested
    const t = dict.admin.dashboard;

    // Fetch real stats
    const [userCount, moduleCount, itemCount, libraryCount] = await Promise.all([
        prisma.user.count(),
        prisma.module.count(),
        prisma.item.count(),
        prisma.userModuleLibrary.count()
    ]);

    const stats = [
        { label: t.stats.users, value: userCount, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
        { label: t.stats.modules, value: moduleCount, icon: Layers, color: "text-indigo-400", bg: "bg-indigo-400/10" },
        { label: t.stats.items, value: itemCount, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10" },
        { label: t.stats.library, value: libraryCount, icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-400/10" },
    ];

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold font-sans tracking-tight">{t.title}</h1>
                <p className="text-slate-400 mt-2">{t.description}</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 transition-all hover:border-indigo-500/30 group">
                        <div className="flex items-center justify-between">
                            <div className={cn("p-3 rounded-2xl transition-colors", stat.bg)}>
                                <stat.icon className={cn("w-6 h-6", stat.color)} />
                            </div>
                        </div>
                        <div className="mt-6">
                            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">{stat.label}</p>
                            <h3 className="text-4xl font-black mt-1 text-slate-100 group-hover:text-white transition-colors">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* System Info & Health */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <Activity className="w-5 h-5 text-indigo-400" />
                        {t.recentActivity}
                    </h2>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                            <Clock className="w-8 h-8 text-slate-600" />
                        </div>
                        <p className="text-slate-500 italic max-w-xs">
                            {t.noActivity}
                        </p>
                    </div>
                </div>

                <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        {t.health}
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors">
                            <div className="flex flex-col">
                                <span className="text-slate-100 font-medium">Database Connection</span>
                                <span className="text-xs text-slate-500 uppercase font-bold tracking-tighter mt-0.5">PostgreSQL / Prisma</span>
                            </div>
                            <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">{t.dbConnected}</span>
                        </div>
                        <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors">
                            <div className="flex flex-col">
                                <span className="text-slate-100 font-medium">Auth Configuration</span>
                                <span className="text-xs text-slate-500 uppercase font-bold tracking-tighter mt-0.5">NextAuth v5 Beta</span>
                            </div>
                            <span className="px-3 py-1 rounded-full text-[10px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{t.operational}</span>
                        </div>
                        <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors">
                            <div className="flex flex-col">
                                <span className="text-slate-100 font-medium">Environment</span>
                                <span className="text-xs text-slate-500 uppercase font-bold tracking-tighter mt-0.5">Railway Deployment</span>
                            </div>
                            <span className="px-3 py-1 rounded-full text-[10px] font-black bg-slate-700/50 text-slate-400 border border-slate-700">{t.production}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

