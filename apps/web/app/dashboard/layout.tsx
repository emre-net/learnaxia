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
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-background border-r">
                <Sidebar className="h-full" />
            </div>
            {/* Added pb-20 to prevent content from hiding behind the new bottom nav on mobile */}
            <main className="md:pl-72 flex-1 min-h-screen overflow-y-auto pb-20 md:pb-0">
                <div className="h-full">
                    {/* Keep top header for branding/usernav, optionally MobileSidebar is still here for Atölye shortcuts */}
                    <div className="flex items-center p-4 md:hidden border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
                        <MobileSidebar />
                        <div className="ml-4 font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                            <Link href="/dashboard">Learnaxia</Link>
                        </div>
                        <div className="ml-auto">
                            <UserNav />
                        </div>
                    </div>
                    <div className="p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </div>
            </main>

            {/* New Mobile Bottom Navigation Bar styled like the Native App */}
            <MobileBottomNav />
        </div>
    )
}
