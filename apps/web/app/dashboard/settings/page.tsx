
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SettingsContent } from "@/components/settings/settings-content";
import { BrandLoader } from "@/components/ui/brand-loader";
import prisma from "@/lib/prisma";

export default async function SettingsPage() {
    // Auth check handled by middleware - removed server-side redirect to prevent
    // redirect loops when session cookie is not properly read in server components
    const session = await auth();
    
    // If no session, render empty state (middleware will handle redirect)
    if (!session?.user) {
        return (
            <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="flex items-center justify-center py-12">
                    <BrandLoader size="lg" />
                </div>
            </div>
        );
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            email: true,
            image: true,
            handle: true,
            language: true,
        },
    });

    if (!user) return null;

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Profil ve Ayarlar</h1>
                <p className="text-muted-foreground">Hesap tercihlerinizi ve kişisel bilgilerinizi yönetin.</p>
            </div>

            <Suspense fallback={
                <div className="flex items-center justify-center py-12">
                    <BrandLoader size="lg" />
                </div>
            }>
                <SettingsContent user={user} />
            </Suspense>
        </div>
    );
}
