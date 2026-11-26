import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { BrandLoader } from "@/components/ui/brand-loader";

export const metadata = {
    title: "Şifre Sıfırlama | Learnaxia",
    description: "Yeni şifrenizi belirleyin.",
};

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[420px] h-[420px] bg-sky-500/8 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[480px] h-[480px] bg-indigo-500/8 rounded-full blur-[140px]" />
            </div>

            <div className="w-full max-w-[440px] relative z-10">
                <Suspense fallback={<div className="flex justify-center py-10"><BrandLoader size="lg" /></div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
