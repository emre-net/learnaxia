"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { BrandLoader } from "@/components/ui/brand-loader"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

const loginSchema = z.object({
    email: z.string().email("Geçerli bir e-posta adresi giriniz."),
    password: z.string().min(6, "Parola en az 6 karakter olmalıdır."),
})

const registerSchema = z.object({
    username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalıdır.").regex(/^[a-zA-Z0-9_-]+$/, "Alfanumerik, tire veya alt çizgi kullanın."),
    email: z.string().email("Geçerli bir e-posta adresi giriniz."),
    password: z.string().min(6, "Parola en az 6 karakter olmalıdır."),
})

export function AuthForm() {
    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const [error, setError] = React.useState<string | null>(null)
    const [success, setSuccess] = React.useState<string | null>(null)
    const [activeTab, setActiveTab] = React.useState<"login" | "register">("login")
    const router = useRouter()

    const loginForm = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    const registerForm = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            username: "",
            email: "",
            password: "",
        },
    })

    async function onLogin(values: z.infer<typeof loginSchema>) {
        setIsLoading(true)
        setError(null)

        try {
            const result = await signIn("credentials", {
                email: values.email,
                password: values.password,
                redirect: false,
            })

            if (result?.error) {
                setError("Giriş yapılamadı. E-posta veya parola hatalı.")
            } else {
                router.push("/dashboard")
                router.refresh()
            }
        } catch (err) {
            setError("Bir hata oluştu. Lütfen tekrar deneyin.")
        } finally {
            setIsLoading(false)
        }
    }

    async function onRegister(values: z.infer<typeof registerSchema>) {
        setIsLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Kayıt işlemi başarısız.")
            }

            setSuccess(data.success || "Doğrulama e-postası gönderildi! Lütfen e-postanızı kontrol edin.")
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        setIsLoading(true)
        await signIn("google", { callbackUrl: "/dashboard" })
    }

    return (
        <Card className="w-full relative group">
            {/* Highly vibrant multi-color glowing border effect behind the card */}
            <div className="absolute -inset-[2px] bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-[30px] blur-md opacity-75 group-hover:opacity-100 transition duration-500 pointer-events-none"></div>

            <div className="relative w-full h-full bg-[#0A1128]/80 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.8)] rounded-[28px] overflow-hidden">
                <div className="px-8 py-10 space-y-6">
                    {error && (
                        <Alert variant="destructive" className="bg-red-500/10 border border-red-500/30 py-2.5 px-3 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                            <AlertCircle className="h-4 w-4 text-red-400" />
                            <AlertDescription className="text-red-400 text-xs ml-2 font-medium">{error}</AlertDescription>
                        </Alert>
                    )}
                    {success && (
                        <Alert className="bg-emerald-500/10 border border-emerald-500/30 py-2.5 px-3 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <AlertDescription className="text-emerald-400 text-xs ml-2 font-medium">{success}</AlertDescription>
                        </Alert>
                    )}

                    {/* Social Login */}
                    <div className="space-y-4">
                        <Button
                            variant="default"
                            type="button"
                            disabled={isLoading}
                            onClick={handleGoogleLogin}
                            className="w-full bg-white hover:bg-zinc-100 text-zinc-900 shadow-[0_0_20px_rgba(255,255,255,0.15)] border border-white h-[52px] rounded-2xl text-base font-bold transition-all duration-300 active:scale-[0.98] group relative overflow-hidden"
                        >
                            {/* Subtle hover gradient inside google button */}
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {isLoading ? (
                                <BrandLoader size="sm" className="mr-2" />
                            ) : (
                                <svg className="mr-3 h-5 w-5 relative z-10" viewBox="0 0 488 512" fill="currentColor">
                                    <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
                                </svg>
                            )}
                            <span className="relative z-10">Google ile Devam Et</span>
                        </Button>
                    </div>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-indigo-500/30" />
                        </div>
                        <div className="relative flex justify-center text-xs font-semibold">
                            <span className="bg-[#0A1128] px-4 text-cyan-100/80 border border-indigo-500/40 rounded-full py-1.5 shadow-sm">
                                veya E-Posta ile
                            </span>
                        </div>
                    </div>

                    {activeTab === "login" ? (
                        <Form {...loginForm}>
                            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-5">
                                <FormField
                                    control={loginForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-[#64748B] group-focus-within:text-blue-400 transition-colors">
                                                        <span className="text-lg font-bold">@</span>
                                                    </div>
                                                    <Input
                                                        className="pl-12 h-[56px] bg-[#0F172A] border-white/10 text-white placeholder:text-slate-400 rounded-2xl focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 transition-all font-medium text-base shadow-inner"
                                                        placeholder="E-posta adresi"
                                                        {...field} disabled={isLoading}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-xs text-red-400" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={loginForm.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-[#64748B] group-focus-within:text-blue-400 transition-colors">
                                                        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                        </svg>
                                                    </div>
                                                    <Input
                                                        type="password"
                                                        className="pl-12 pr-12 h-[56px] bg-[#0F172A] border-white/10 text-white placeholder:text-slate-400 rounded-2xl focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 transition-all font-medium text-base shadow-inner"
                                                        placeholder="Parola"
                                                        {...field} disabled={isLoading}
                                                    />
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#64748B] hover:text-[#94A3B8] cursor-pointer transition-colors">
                                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                                            <circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-xs text-red-400" />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex justify-end pb-1">
                                    <span className="text-xs font-bold text-blue-400/80 cursor-pointer hover:text-white transition-colors underline underline-offset-4 decoration-blue-500/30">Şifremi unuttum?</span>
                                </div>

                                <Button type="submit" className="w-full h-[52px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold shadow-[0_4px_14px_rgba(79,70,229,0.4)] border-none transition-all duration-300 active:scale-[0.98]" disabled={isLoading}>
                                    {isLoading && <BrandLoader size="sm" className="mr-2" />}
                                    Giriş Yap
                                </Button>

                                <div className="text-center pt-4">
                                    <span className="text-[13px] text-[#64748B] font-medium">Hesabın yok mu? </span>
                                    <span className="text-[13px] text-[#00D2FF] font-bold cursor-pointer hover:text-blue-400 transition-colors" onClick={() => setActiveTab("register")}>Kaydol</span>
                                </div>
                            </form>
                        </Form>
                    ) : (
                        <Form {...registerForm}>
                            <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-5">
                                <FormField
                                    control={registerForm.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-[#64748B] group-focus-within:text-blue-400 transition-colors">
                                                        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                                        </svg>
                                                    </div>
                                                    <Input
                                                        className="pl-12 h-[56px] bg-[#0F172A] border-white/10 text-white placeholder:text-slate-400 rounded-2xl focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 transition-all font-medium text-base shadow-inner"
                                                        placeholder="Kullanıcı Adı"
                                                        {...field} disabled={isLoading}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-xs text-red-400" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={registerForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-[#64748B] group-focus-within:text-blue-400 transition-colors">
                                                        <span className="text-lg font-bold">@</span>
                                                    </div>
                                                    <Input
                                                        className="pl-12 h-[56px] bg-[#0F172A] border-white/10 text-white placeholder:text-slate-400 rounded-2xl focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 transition-all font-medium text-base shadow-inner"
                                                        placeholder="E-posta adresi"
                                                        {...field} disabled={isLoading}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-xs text-red-400" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={registerForm.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-[#64748B] group-focus-within:text-blue-400 transition-colors">
                                                        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                        </svg>
                                                    </div>
                                                    <Input
                                                        type="password"
                                                        className="pl-12 pr-12 h-[56px] bg-[#0F172A] border-white/10 text-white placeholder:text-slate-400 rounded-2xl focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 transition-all font-medium text-base shadow-inner"
                                                        placeholder="Parola (En az 6 karakter)"
                                                        {...field} disabled={isLoading}
                                                    />
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#64748B] hover:text-[#94A3B8] cursor-pointer transition-colors">
                                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                                            <circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-xs text-red-400" />
                                        </FormItem>
                                    )}
                                />
                                <div className="pt-3">
                                    <Button type="submit" className="w-full h-[52px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold shadow-[0_4px_14px_rgba(79,70,229,0.4)] border-none transition-all duration-300 active:scale-[0.98]" disabled={isLoading}>
                                        {isLoading && <BrandLoader size="sm" className="mr-2" />}
                                        Hesabı Oluştur
                                    </Button>
                                </div>

                                <div className="text-center pt-4">
                                    <span className="text-[13px] text-[#64748B] font-medium">Zaten hesabın var mı? </span>
                                    <span className="text-[13px] text-[#00D2FF] font-bold cursor-pointer hover:text-blue-400 transition-colors" onClick={() => setActiveTab("login")}>Giriş Yap</span>
                                </div>
                            </form>
                        </Form>
                    )}
                </div>
            </div>
        </Card>
    )
}
