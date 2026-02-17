
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SettingsContent } from "@/components/settings/settings-content";
import { Loader2 } from "lucide-react";

export default async function SettingsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Profil ve Ayarlar</h1>
                <p className="text-muted-foreground">Hesap tercihlerinizi ve kişisel bilgilerinizi yönetin.</p>
            </div>

            <Suspense fallback={
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            }>
                <SettingsContent user={{
                    name: session.user.name,
                    email: session.user.email,
                    image: session.user.image,
                }} />
            </Suspense>
        </div>
    );
}
