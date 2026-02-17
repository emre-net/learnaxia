"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrainCircuit, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function VerifyPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Doğrulama linki geçersiz.");
            return;
        }

        fetch(`/api/auth/verify?token=${token}`)
            .then(async (res) => {
                const data = await res.json();
                if (res.ok) {
                    setStatus("success");
                    setMessage(data.success || "E-posta doğrulandı!");
                } else {
                    setStatus("error");
                    setMessage(data.error || "Doğrulama başarısız.");
                }
            })
            .catch(() => {
                setStatus("error");
                setMessage("Bir hata oluştu.");
            });
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                            <BrainCircuit className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">E-posta Doğrulama</CardTitle>
                    <CardDescription>Learnaxia hesabınızı doğruluyoruz.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {status === "loading" && (
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-muted-foreground">Doğrulanıyor...</p>
                        </div>
                    )}
                    {status === "success" && (
                        <div className="flex flex-col items-center gap-3">
                            <CheckCircle2 className="h-10 w-10 text-green-500" />
                            <p className="text-green-500 font-medium">{message}</p>
                            <Button asChild className="mt-4">
                                <Link href="/login">Giriş Yap</Link>
                            </Button>
                        </div>
                    )}
                    {status === "error" && (
                        <div className="flex flex-col items-center gap-3">
                            <XCircle className="h-10 w-10 text-red-500" />
                            <p className="text-red-500 font-medium">{message}</p>
                            <Button variant="outline" asChild className="mt-4">
                                <Link href="/login">Giriş Sayfasına Dön</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
