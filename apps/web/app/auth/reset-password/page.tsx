import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { BrandLoader } from "@/components/ui/brand-loader";

export const metadata = {
    title: "Şifre Sıfırlama | Learnaxia",
    description: "Yeni şifrenizi belirleyin.",
};

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-[#020817] flex items-center justify-center p-4">
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] mix-blend-screen animate-pulse animation-delay-2000" />
            </div>

            <div className="w-full max-w-[440px] relative z-10">
                <Suspense fallback={<div className="flex justify-center py-10"><BrandLoader size="lg" /></div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
