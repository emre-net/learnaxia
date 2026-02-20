import {
    Activity,
    Server,
    Database,
    ShieldCheck,
    Cpu,
    MemoryStick,
    Globe,
    Lock
} from "lucide-react";

export default function AdminSystemPage() {
    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold">Sistem Sağlığı</h1>
                <p className="text-slate-400 mt-2">Sunucu performansı, veritabanı durumu ve güvenlik yapılandırmalarını izleyin.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Server Status */}
                <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <Server className="w-5 h-5 text-indigo-400" />
                        Sunucu Durumu
                    </h2>
                    <div className="space-y-6">
                        <HealthItem label="Runtime" value="Node.js 20.x" icon={Activity} color="text-emerald-400" />
                        <HealthItem label="Platform" value="Railway (Edge)" icon={Globe} color="text-blue-400" />
                        <HealthItem label="CPU Usage" value="%12" icon={Cpu} color="text-indigo-400" />
                        <HealthItem label="Memory" value="128MB / 512MB" icon={MemoryStick} color="text-amber-400" />
                    </div>
                </div>

                {/* Database Health */}
                <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <Database className="w-5 h-5 text-emerald-400" />
                        Veritabanı Sağlığı
                    </h2>
                    <div className="space-y-6">
                        <HealthItem label="DB Status" value="Healthy" icon={ShieldCheck} color="text-emerald-400" />
                        <HealthItem label="Connection Pool" value="3 Active" icon={Activity} color="text-indigo-400" />
                        <HealthItem label="SSL" value="Enabled" icon={Lock} color="text-emerald-400" />
                        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 mt-4">
                            <p className="text-xs text-slate-500 uppercase font-black tracking-widest mb-1">Last Backup</p>
                            <p className="text-slate-300 font-medium font-sans">2 hours ago (Railway Managed)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function HealthItem({ label, value, icon: Icon, color }: { label: string, value: string, icon: any, color: string }) {
    return (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/30 border border-slate-800/50 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-slate-800 border border-slate-700`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <span className="text-slate-300 font-medium">{label}</span>
            </div>
            <span className="font-bold text-slate-100">{value}</span>
        </div>
    );
}
