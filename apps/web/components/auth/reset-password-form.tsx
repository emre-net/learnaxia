"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Lock, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { BrandLoader } from "@/components/ui/brand-loader";
import { useToast } from "@/components/ui/use-toast";
import { RegisterPasswordSchema } from "@learnaxia/shared";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const resetSchema = z.object({
    password: RegisterPasswordSchema,
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Parolalar eşleşmiyor.",
    path: ["confirmPassword"],
});

type ResetFormValues = z.infer<typeof resetSchema>;

export function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const token = searchParams.get("token");

    const [isLoading, setIsLoading] = React.useState(false);
    const [isSuccess, setIsSuccess] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const form = useForm<ResetFormValues>({
        resolver: zodResolver(resetSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    React.useEffect(() => {
        if (!token) {
            setError("Geçersiz veya eksik sıfırlama bağlantısı. Lütfen e-postanızdaki bağlantıya tıkladığınızdan emin olun.");
        }
    }, [token]);

    const onSubmit = async (data: ResetFormValues) => {
        if (!token) return;

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    password: data.password
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                setError(result.error || "Bir hata oluştu.");
            } else {
                setIsSuccess(true);
                toast({
                    title: "Başarılı",
                    description: "Şifreniz başarıyla değiştirildi. Giriş yapabilirsiniz.",
                });
                setTimeout(() => {
                    router.push("/login?tab=login");
                }, 3000);
            }
        } catch {
            setError("Sunucuya bağlanılamadı.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="bg-[#121215]/95 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Şifre Değiştirildi</h2>
                <p className="text-zinc-400 font-medium">Yeni şifrenizle giriş yapmaya yönlendiriliyorsunuz...</p>
                <BrandLoader className="mt-4" size="md" />
            </div>
        );
    }

    return (
        <div className="bg-[#121215]/95 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-8 relative overflow-hidden">
            <div className="space-y-2 text-center relative z-10">
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
                    Yeni Şifre Belirle
                </h1>
                <p className="text-sm text-zinc-400">
                    En az 8 karakterli güçlü bir parola oluşturun ve hesabınızı güvence altına alın.
                </p>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start space-x-3 text-red-400">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium leading-relaxed">{error}</p>
                </div>
            )}

            {!error && token && (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 relative z-10">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-zinc-500 group-focus-within:text-sky-400 transition-colors">
                                                <Lock className="h-5 w-5" />
                                            </div>
                                            <Input
                                                type="password"
                                                className="pl-12 h-[54px] bg-[#18181b] border-zinc-800 text-zinc-100 placeholder:text-zinc-500 rounded-2xl focus:border-sky-400 focus:ring-1 focus:ring-sky-400/40 transition-all font-medium text-base"
                                                placeholder="Yeni Parola (En az 8 karakter)"
                                                {...field} disabled={isLoading}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-xs text-red-400" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-zinc-500 group-focus-within:text-sky-400 transition-colors">
                                                <Lock className="h-5 w-5" />
                                            </div>
                                            <Input
                                                type="password"
                                                className="pl-12 h-[54px] bg-[#18181b] border-zinc-800 text-zinc-100 placeholder:text-zinc-500 rounded-2xl focus:border-sky-400 focus:ring-1 focus:ring-sky-400/40 transition-all font-medium text-base"
                                                placeholder="Yeni Parolayı Doğrula"
                                                {...field} disabled={isLoading}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-xs text-red-400" />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full h-[52px] bg-sky-500 hover:bg-sky-400 text-zinc-950 rounded-2xl font-bold border-none transition-all duration-200 active:scale-[0.98]" disabled={isLoading}>
                            {isLoading ? (
                                <BrandLoader size="sm" className="mr-2" />
                            ) : (
                                <>
                                    Şifreyi Değiştir <ArrowRight className="ml-2 w-5 h-5" />
                                </>
                            )}
                        </Button>
                    </form>
                </Form>
            )}

            {!token && (
                <Button
                    variant="outline"
                    className="w-full h-[52px] border-zinc-800 bg-transparent text-zinc-100 hover:bg-zinc-800/60 rounded-2xl font-bold transition-all"
                    onClick={() => router.push("/login?tab=login")}
                >
                    Giriş Sayfasına Dön
                </Button>
            )}
        </div>
    );
}
