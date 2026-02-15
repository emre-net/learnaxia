import { Metadata } from "next"
import Link from "next/link"
import { BrainCircuit } from "lucide-react"
import { AuthForm } from "@/components/auth/auth-form"

export const metadata: Metadata = {
    title: "Giriş Yap | Learnaxia",
    description: "Hesabına giriş yap veya yeni kayıt oluştur.",
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
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
                    <AuthForm />
                    <p className="px-8 text-center text-sm text-muted-foreground">
                        Devam ederek <Link href="/terms" className="underline underline-offset-4 hover:text-primary">Kullanım Şartları</Link> ve <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">Gizlilik Politikası</Link>'nı kabul etmiş olursun.
                    </p>
                </div>
            </div>
        </div>
    )
}
