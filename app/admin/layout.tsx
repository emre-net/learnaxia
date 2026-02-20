import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "./components/admin-sidebar";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    // Safety check again in layout
    if ((session?.user as any)?.role !== "ADMIN") {
        redirect("/dashboard");
    }

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-50 font-sans">
            {/* Admin Sidebar */}
            <AdminSidebar />

            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
