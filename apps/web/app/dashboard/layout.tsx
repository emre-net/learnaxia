import { Sidebar, MobileSidebar } from "@/components/layout/sidebar"
import { UserNav } from "@/components/layout/user-nav"
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"
import { GuestDataSyncTrigger } from "@/components/auth/guest-data-sync-trigger"
import Link from "next/link"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="h-full relative bg-[#09090b]">
            <GuestDataSyncTrigger />
            {/* Desktop Sidebar (Only >= 1024px) */}
            <div className="hidden h-full lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 z-[80] bg-[#09090b] border-r border-white/[0.07]">
                <Sidebar className="h-full" />
            </div>

            {/* Main content — pb-36 mobile/tablet (<1024px) için bottom nav boşluğu, lg:pb-0 desktop */}
            <main className="lg:pl-72 flex-1 min-h-screen overflow-y-auto pb-36 lg:pb-0 bg-[#09090b]">
                <div className="h-full">
                    {/* Mobile & Tablet top header (< 1024px) */}
                    <div className="flex items-center gap-3 px-4 py-3 lg:hidden border-b border-white/[0.07] bg-[#09090b]/85 backdrop-blur-md sticky top-0 z-50">
                        <MobileSidebar />
                        <Link href="/dashboard" className="font-black text-lg tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-500 uppercase">
                            LRX
                        </Link>
                        <div className="ml-auto">
                            <UserNav />
                        </div>
                    </div>

                    {/* Page content — responsive padding */}
                    <div className="p-3.5 sm:p-5 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </div>
            </main>

            {/* Mobile & Tablet Bottom Navigation (< 1024px) */}
            <MobileBottomNav />
        </div>
    )
}
