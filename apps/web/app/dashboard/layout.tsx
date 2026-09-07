import { Sidebar, MobileSidebar } from "@/components/layout/sidebar"
import { UserNav } from "@/components/layout/user-nav"
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"
import Link from "next/link"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="h-full relative">
            {/* Desktop Sidebar */}
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-background border-r border-white/[0.07]">
                <Sidebar className="h-full" />
            </div>

            {/* Main content — pb-24 mobile için bottom nav boşluğu */}
            <main className="md:pl-72 flex-1 min-h-screen overflow-y-auto pb-24 md:pb-0">
                <div className="h-full">
                    {/* Mobile top header */}
                    <div className="flex items-center gap-3 px-4 py-3 md:hidden border-b border-white/[0.07] bg-background/80 backdrop-blur-md sticky top-0 z-50">
                        <MobileSidebar />
                        <Link href="/dashboard" className="font-black text-lg tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-500 uppercase">
                            LRX
                        </Link>
                        <div className="ml-auto">
                            <UserNav />
                        </div>
                    </div>

                    {/* Page content — responsive padding */}
                    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />
        </div>
    )
}
