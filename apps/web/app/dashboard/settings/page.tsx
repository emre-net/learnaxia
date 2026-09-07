export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SettingsContent } from "@/components/settings/settings-content";
import { BrandLoader } from "@/components/ui/brand-loader";
import prisma from "@/lib/prisma";

export default async function SettingsPage() {
    let session = null;
    try {
        // Add a safety timeout for auth() if possible, or just catch errors
        session = await auth();
    } catch (e) {
        console.error("[Settings] Session fetch failed", e);
    }
    
    // If no session, middleware will handle redirect, but we show a link as fallback
    if (!session?.user) {
        return (
            <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 flex flex-col items-center justify-center min-h-[50vh]">
                <h2 className="text-xl font-semibold">Oturum Açmanız Gerekiyor</h2>
                <p className="text-muted-foreground mb-4">Ayarlara erişmek için lütfen giriş yapın.</p>
                <div className="flex items-center justify-center p-4">
                     <BrandLoader size="lg" />
                </div>
            </div>
        );
    }

    let user = null;
    try {
        user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                email: true,
                image: true,
                handle: true,
                language: true,
            },
        });
    } catch (e) {
        console.error("[Settings] DB fetch failed", e);
    }

    if (!user) {
        return (
            <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 flex flex-col items-center justify-center min-h-[50vh]">
                <h2 className="text-xl font-semibold">Veri Alınamadı</h2>
                <p className="text-muted-foreground">Şu an kullanıcı bilgilerinize erişemiyoruz. Lütfen daha sonra tekrar deneyin.</p>
            </div>
        );
    }

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
