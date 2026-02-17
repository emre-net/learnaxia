"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

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
        <Card className="w-full max-w-md mx-auto shadow-2xl border-muted/50">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold tracking-tight text-center">
                    {activeTab === "login" ? "Tekrar Hoş Geldin" : "Hesap Oluştur"}
                </CardTitle>
                <CardDescription className="text-center">
                    {activeTab === "login"
                        ? "Öğrenme yolculuğuna kaldığın yerden devam et."
                        : "Hemen aramıza katıl ve öğrenmeye başla."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {success && (
                    <Alert className="mb-4 border-green-500/50 bg-green-500/10">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <AlertDescription className="text-green-600">{success}</AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-4">
                    <Button
                        variant="outline"
                        type="button"
                        disabled={isLoading}
                        onClick={handleGoogleLogin}
                        className="w-full py-6 text-md font-medium relative overflow-hidden group hover:border-primary/50 transition-all duration-300"
                    >
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                            </svg>
                        )}
                        Google ile Devam Et
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                veya E-Posta ile
                            </span>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="login">Giriş Yap</TabsTrigger>
                            <TabsTrigger value="register">Kayıt Ol</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <Form {...loginForm}>
                                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                                    <FormField
                                        control={loginForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>E-Posta</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="ornek@email.com" {...field} disabled={isLoading} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={loginForm.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Parola</FormLabel>
                                                <FormControl>
                                                    <Input type="password" placeholder="******" {...field} disabled={isLoading} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Giriş Yap
                                    </Button>
                                </form>
                            </Form>
                        </TabsContent>

                        <TabsContent value="register">
                            <Form {...registerForm}>
                                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                                    <FormField
                                        control={registerForm.control}
                                        name="username"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Kullanıcı Adı</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="kullanici_adi" {...field} disabled={isLoading} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={registerForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>E-Posta</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="ornek@email.com" {...field} disabled={isLoading} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={registerForm.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Parola</FormLabel>
                                                <FormControl>
                                                    <Input type="password" placeholder="En az 6 karakter" {...field} disabled={isLoading} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Kayıt Ol
                                    </Button>
                                </form>
                            </Form>
                        </TabsContent>
                    </Tabs>
                </div>
            </CardContent>
        </Card>
    )
}
