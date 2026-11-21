"use client";

import { useEffect, useState, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { BrandLoader } from "@/components/ui/brand-loader";

function MobileGoogleAuthContent() {
    const { data: session, status } = useSession();
    const searchParams = useSearchParams();
    const [statusText, setStatusText] = useState("Google ile bağlantı kuruluyor...");

    const redirectUri = searchParams.get("redirect_uri") || "learnaxia://auth/callback";

    useEffect(() => {
        if (status === "loading") return;

        const callbackUrl = `/api/mobile/auth/google/callback?redirect_uri=${encodeURIComponent(redirectUri)}`;

        if (status === "authenticated" && session?.user) {
            setStatusText("Oturum doğrulandı, uygulamaya aktarılıyor...");
            window.location.replace(callbackUrl);
        } else {
            setStatusText("Google giriş ekranı açılıyor...");
            signIn("google", { callbackUrl });
        }
    }, [status, session, redirectUri]);

    return (
        <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col items-center justify-center p-6 text-center">
            <div className="p-8 rounded-2xl bg-[#121215] border border-white/10 max-w-sm w-full space-y-5 shadow-2xl">
                <div className="flex justify-center py-2">
                    <BrandLoader size="lg" />
                </div>
                <div className="space-y-1">
                    <h1 className="text-xl font-bold tracking-tight text-zinc-100">LearnAxia</h1>
                    <p className="text-sm text-zinc-400">{statusText}</p>
                </div>
            </div>
        </div>
    );
}

export default function MobileGoogleAuthPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex items-center justify-center p-6">
                    <BrandLoader size="lg" />
                </div>
            }
        >
            <MobileGoogleAuthContent />
        </Suspense>
    );
}
