import { Sidebar, MobileSidebar } from "@/components/layout/sidebar"
import { UserNav } from "@/components/layout/user-nav" // We will create this next

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
            <main className="md:pl-72 flex-1 min-h-screen overflow-y-hidden">
                <div className="h-full overflow-y-auto">
                    <div className="flex items-center p-4 md:hidden border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
                        <MobileSidebar />
                        <div className="ml-auto">
                            {/* Mobile User Nav Placeholder */}
                        </div>
                    </div>
                    <div className="p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}
