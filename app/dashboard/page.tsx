import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Dashboard | Learnaxia",
    description: "Öğrenme istatistiklerin ve modüllerin.",
}

export default function DashboardPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Genel Bakış</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Placeholder Cards */}
                <div className="p-6 bg-card rounded-xl border shadow-sm">
                    <h3 className="font-medium text-sm text-muted-foreground">Toplam Çalışma</h3>
                    <div className="text-2xl font-bold mt-2">0 dk</div>
                </div>
                <div className="p-6 bg-card rounded-xl border shadow-sm">
                    <h3 className="font-medium text-sm text-muted-foreground">Aktif Modüller</h3>
                    <div className="text-2xl font-bold mt-2">0</div>
                </div>
                <div className="p-6 bg-card rounded-xl border shadow-sm">
                    <h3 className="font-medium text-sm text-muted-foreground">Jeton Bakiyesi</h3>
                    <div className="text-2xl font-bold mt-2 text-primary">50 🪙</div>
                </div>
                <div className="p-6 bg-card rounded-xl border shadow-sm">
                    <h3 className="font-medium text-sm text-muted-foreground">Doğruluk Oranı</h3>
                    <div className="text-2xl font-bold mt-2">%0</div>
                </div>
            </div>
        </div>
    )
}
