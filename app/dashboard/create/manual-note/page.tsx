"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileText, ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

export default function ManualNotePage() {
    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/create">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Not Atölyesi</h1>
                    <p className="text-slate-400">Elle not alın ve sisteminize kaydedin.</p>
                </div>
            </div>

            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle>Yeni Not</CardTitle>
                    <CardDescription>Buraya notlarınızı yazmaya başlayın. Zengin metin editörü yakında eklenecek.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <textarea
                        className="w-full min-h-[400px] bg-slate-950 border border-slate-800 rounded-xl p-6 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        placeholder="Notlarınızı buraya yazın..."
                    />
                    <div className="flex justify-end">
                        <Button className="bg-blue-600 hover:bg-blue-700 font-bold">
                            <Save className="mr-2 h-4 w-4" /> Notu Kaydet
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
