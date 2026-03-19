import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "./components/admin-sidebar";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    const userEmail = session?.user?.email;

    // Robust check matching auth.config.ts
    const isAdmin = userRole === "ADMIN" ||
        userEmail === "netemre387@gmail.com" ||
        userEmail === process.env.ADMIN_EMAIL;

    if (!isAdmin) {
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
