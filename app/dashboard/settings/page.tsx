
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SettingsContent } from "@/components/settings/settings-content";

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
            <SettingsContent user={{
                name: session.user.name,
                email: session.user.email,
                image: session.user.image,
            }} />
        </div>
    );
}
