"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, CheckCircle2, Eye, EyeOff, User, AtSign } from "lucide-react"
import { BrandLoader } from "@/components/ui/brand-loader"
import { useToast } from "@/components/ui/use-toast"
import { syncGuestDataToServer } from "@/lib/guest-sync"
import { LoginSchema, RegisterSchema } from "@learnaxia/shared"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

type LoginValues = z.infer<typeof LoginSchema>
type RegisterValues = z.infer<typeof RegisterSchema>

export function AuthForm() {
    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const [error, setError] = React.useState<string | null>(null)
    const [success, setSuccess] = React.useState<string | null>(null)
    const searchParams = useSearchParams()
    const router = useRouter()
    const { toast } = useToast()
    const [isResetting, setIsResetting] = React.useState(false)
    const [showPassword, setShowPassword] = React.useState(false)

    const initialTab = searchParams.get("tab") === "register" ? "register" : "login"
    const [activeTab, setActiveTab] = React.useState<"login" | "register">(initialTab)

    React.useEffect(() => {
        const tab = searchParams.get("tab")
        if (tab === "register" || tab === "login") {
            setActiveTab(tab)
        }
    }, [searchParams])

    const loginForm = useForm<LoginValues>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    const registerForm = useForm<RegisterValues>({
        resolver: zodResolver(RegisterSchema),
        defaultValues: {
            handle: "",
            name: "",
            email: "",
            password: "",
        },
    })

    async function onLogin(values: LoginValues) {
        setIsLoading(true)
        setError(null)

        try {
            const result = await signIn("credentials", {
                email: values.email.trim().toLowerCase(),
                password: values.password,
                redirect: false,
            })

            if (result?.error) {
                setError("Giriş yapılamadı. E-posta veya parola hatalı.")
            } else {
                syncGuestDataToServer().catch(() => {})
                router.push("/dashboard")
                router.refresh()
            }
        } catch {
            setError("Bir hata oluştu. Lütfen tekrar deneyin.")
        } finally {
            setIsLoading(false)
        }
    }

    async function onRegister(values: RegisterValues) {
        setIsLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    handle: values.handle.trim().toLowerCase(),
                    name: values.name?.trim() || undefined,
                    email: values.email.trim().toLowerCase(),
                    password: values.password,
                }),
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

    const handleForgotPassword = async () => {
        const email = loginForm.getValues("email")
        if (!email || !email.includes("@")) {
            toast({
                title: "E-posta gerekli",
                description: "Lütfen yukarıdaki E-Posta alanına geçerli bir adres yazın ve tekrar tıklayın.",
                variant: "destructive"
            })
            return
        }

        setIsResetting(true)
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim().toLowerCase() })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Hata oluştu.")

            toast({
                title: "Bağlantı Gönderildi!",
                description: "E-posta adresinizi kontrol edin. Gelen kutunuza (veya spam klasörüne) bir sıfırlama bağlantısı gönderildi.",
            })
        } catch (error: any) {
            toast({
                title: "İşlem Başarısız",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setIsResetting(false)
        }
    }

    const inputClass =
        "pl-12 h-[54px] bg-[#18181b] border-zinc-800 text-zinc-100 placeholder:text-zinc-500 rounded-2xl focus:border-sky-400 focus:ring-1 focus:ring-sky-400/40 transition-all font-medium text-base"

    return (
        <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-1.5 text-center mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-100">
                    {activeTab === "login" ? "Tekrar Hoş Geldin" : "Hesap Oluşturun"}
                </h2>
                <p className="text-sm text-zinc-400">
                    {activeTab === "login" ? "Devam etmek için hesabınıza giriş yapın." : "Öğrenme yolculuğunuza bugün başlayın."}
                </p>
            </div>

            <div className="space-y-5">
                {error && (
                    <Alert variant="destructive" className="bg-red-500/10 border border-red-500/30 py-2.5 px-3 rounded-xl">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <AlertDescription className="text-red-400 text-xs ml-2 font-medium">{error}</AlertDescription>
                    </Alert>
                )}
                {success && (
                    <Alert className="bg-emerald-500/10 border border-emerald-500/30 py-2.5 px-3 rounded-xl">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <AlertDescription className="text-emerald-300 text-xs ml-2 font-medium">{success}</AlertDescription>
                    </Alert>
                )}

                {/* Google Login */}
                <Button
                    variant="outline"
                    type="button"
                    disabled={isLoading}
                    onClick={handleGoogleLogin}
                    className="w-full bg-[#f4f4f5] hover:bg-zinc-200 text-zinc-950 border-zinc-200 h-[52px] rounded-2xl text-base font-bold transition-all active:scale-[0.98]"
                >
                    {isLoading ? (
                        <BrandLoader size="sm" className="mr-2" />
                    ) : (
                        <svg className="mr-3 h-5 w-5" viewBox="0 0 488 512" fill="currentColor">
                            <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
                        </svg>
                    )}
                    <span>Google ile Devam Et</span>
                </Button>

                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-zinc-800" />
                    </div>
                    <div className="relative flex justify-center text-xs font-medium">
                        <span className="bg-[#121215] px-3.5 text-zinc-400 border border-zinc-800 rounded-full py-1">
                            veya E-Posta ile
                        </span>
                    </div>
                </div>

                {activeTab === "login" ? (
                    <Form key="login-form" {...loginForm}>
                        <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                            <FormField
                                control={loginForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-zinc-500 group-focus-within:text-sky-400 transition-colors">
                                                    <AtSign className="h-4.5 w-4.5" />
                                                </div>
                                                <Input
                                                    type="email"
                                                    className={inputClass}
                                                    placeholder="E-posta adresi"
                                                    {...field}
                                                    disabled={isLoading}
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
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-zinc-500 group-focus-within:text-sky-400 transition-colors">
                                                    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                    </svg>
                                                </div>
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    className={`${inputClass} pr-12`}
                                                    placeholder="Parola"
                                                    {...field}
                                                    disabled={isLoading}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(prev => !prev)}
                                                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-500 hover:text-zinc-200 transition-colors"
                                                    aria-label={showPassword ? "Parolayı Gizle" : "Parolayı Göster"}
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-xs text-red-400" />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end pb-1">
                                <button
                                    type="button"
                                    className="text-xs font-semibold text-sky-400 cursor-pointer hover:text-sky-300 transition-colors bg-transparent border-none p-0"
                                    onClick={handleForgotPassword}
                                >
                                    {isResetting ? "Gönderiliyor..." : "Şifremi unuttum?"}
                                </button>
                            </div>

                            <Button type="submit" className="w-full h-[52px] bg-sky-500 hover:bg-sky-400 text-zinc-950 rounded-2xl font-bold border-none transition-all active:scale-[0.98]" disabled={isLoading}>
                                {isLoading && <BrandLoader size="sm" className="mr-2" />}
                                Giriş Yap
                            </Button>

                            <div className="text-center pt-3">
                                <span className="text-[13px] text-zinc-400">Hesabın yok mu? </span>
                                <button type="button" className="text-[13px] text-sky-400 font-semibold cursor-pointer hover:text-sky-300 transition-colors bg-transparent border-none p-0" onClick={() => setActiveTab("register")}>Kaydol</button>
                            </div>
                        </form>
                    </Form>
                ) : (
                    <Form key="register-form" {...registerForm}>
                        <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                            <FormField
                                control={registerForm.control}
                                name="handle"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-zinc-500 group-focus-within:text-sky-400 transition-colors">
                                                    <AtSign className="h-4.5 w-4.5" />
                                                </div>
                                                <Input
                                                    type="text"
                                                    className={inputClass}
                                                    placeholder="Kullanıcı adı (zorunlu)"
                                                    autoCapitalize="none"
                                                    {...field}
                                                    disabled={isLoading}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-xs text-red-400" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={registerForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-zinc-500 group-focus-within:text-sky-400 transition-colors">
                                                    <User className="h-4.5 w-4.5" />
                                                </div>
                                                <Input
                                                    type="text"
                                                    className={inputClass}
                                                    placeholder="Görünen isim (isteğe bağlı)"
                                                    {...field}
                                                    value={field.value || ""}
                                                    disabled={isLoading}
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
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-zinc-500 group-focus-within:text-sky-400 transition-colors">
                                                    <span className="text-base font-bold">@</span>
                                                </div>
                                                <Input
                                                    type="email"
                                                    className={inputClass}
                                                    placeholder="E-posta adresi"
                                                    {...field}
                                                    disabled={isLoading}
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
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-zinc-500 group-focus-within:text-sky-400 transition-colors">
                                                    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                    </svg>
                                                </div>
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    className={`${inputClass} pr-12`}
                                                    placeholder="Parola (En az 8 karakter)"
                                                    {...field}
                                                    disabled={isLoading}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(prev => !prev)}
                                                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-500 hover:text-zinc-200 transition-colors"
                                                    aria-label={showPassword ? "Parolayı Gizle" : "Parolayı Göster"}
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-xs text-red-400" />
                                    </FormItem>
                                )}
                            />
                            <div className="pt-2">
                                <Button type="submit" className="w-full h-[52px] bg-sky-500 hover:bg-sky-400 text-zinc-950 rounded-2xl font-bold border-none transition-all active:scale-[0.98]" disabled={isLoading}>
                                    {isLoading && <BrandLoader size="sm" className="mr-2" />}
                                    Hesabı Oluştur
                                </Button>
                            </div>

                            <div className="text-center pt-3">
                                <span className="text-[13px] text-zinc-400">Zaten hesabın var mı? </span>
                                <button type="button" className="text-[13px] text-sky-400 font-semibold cursor-pointer hover:text-sky-300 transition-colors bg-transparent border-none p-0" onClick={() => setActiveTab("login")}>Giriş Yap</button>
                            </div>
                        </form>
                    </Form>
                )}
            </div>

            <div className="pt-1">
                <Link
                    href="/study/tutorial"
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-sky-500/20 bg-sky-500/5 hover:bg-sky-500/10 text-xs text-sky-300 hover:text-zinc-100 transition-all group"
                >
                    <span className="flex items-center gap-2 font-medium">
                        <span className="text-base">🚀</span>
                        Hesap açmadan sistemi keşfet: Demo Modu
                    </span>
                    <span className="text-sky-400 group-hover:translate-x-0.5 transition-transform font-bold">
                        Hemen Başla →
                    </span>
                </Link>
            </div>

            <p className="text-center text-xs text-zinc-500 pt-1 leading-relaxed">
                Devam ederek{" "}
                <Link href="/terms" className="underline hover:text-zinc-300 transition-colors">
                    Kullanım Şartları
                </Link>{" "}
                ve{" "}
                <Link href="/privacy" className="underline hover:text-zinc-300 transition-colors">
                    Gizlilik Politikası
                </Link>
                &apos;nı kabul etmiş olursunuz.
            </p>
        </div>
    )
}
