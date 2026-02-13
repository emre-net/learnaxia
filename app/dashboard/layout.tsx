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
            <main className="md:pl-72 h-full">
                <div className="flex items-center p-4 md:hidden border-b">
                    <MobileSidebar />
                    <div className="ml-auto">
                        {/* Mobile User Nav Placeholder */}
                    </div>
                </div>
                {children}
            </main>
        </div>
    )
}
