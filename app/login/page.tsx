import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { signIn } from "@/auth"
import { BrainCircuit } from "lucide-react"

export const metadata: Metadata = {
    title: "Giriş Yap | Learnaxia",
    description: "Hesabına giriş yap.",
}

export default function LoginPage() {
    return (
        <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
                <div className="absolute inset-0 bg-zinc-900" />
                <div className="relative z-20 flex items-center text-lg font-medium">
                    <BrainCircuit className="mr-2 h-6 w-6" />
                    Learnaxia
                </div>
                <div className="relative z-20 mt-auto">
                    <blockquote className="space-y-2">
                        <p className="text-lg">
                            &ldquo;Öğrenmek, akıntıya karşı kürek çekmek gibidir; durduğunuz an geriye gidersiniz.&rdquo;
                        </p>
                        <footer className="text-sm">Konfüçyüs</footer>
                    </blockquote>
                </div>
            </div>
            <div className="lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Hesabına Giriş Yap
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Devam etmek için Google hesabını kullan.
                        </p>
                    </div>

                    <div className="grid gap-6">
                        <form
                            action={async () => {
                                "use server"
                                await signIn("google", { redirectTo: "/dashboard" })
                            }}
                        >
                            <Button variant="outline" className="w-full" type="submit">
                                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                </svg>
                                Google ile Giriş Yap
                            </Button>
                        </form>
                    </div>

                    <p className="px-8 text-center text-sm text-muted-foreground">
                        Devam ederek <Link href="/terms" className="underline underline-offset-4 hover:text-primary">Kullanım Şartları</Link> ve <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">Gizlilik Politikası</Link>'nı kabul etmiş olursun.
                    </p>
                </div>
            </div>
        </div>
    )
}
