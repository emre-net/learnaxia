"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BrainCircuit, Loader2, UploadCloud } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function CreateLearningPlanPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [step, setStep] = useState<"input" | "generating" | "review">("input")

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        // TODO: Call API to generate syllabus
        setTimeout(() => {
            setIsLoading(false)
            setStep("review") // Mock flow
        }, 2000)
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">İnteraktif Ders Oluştur</h1>
                <p className="text-muted-foreground">
                    Herhangi bir konuyu veya belgeyi etkileşimli bir derse dönüştür.
                </p>
            </div>

            <Card className="border-indigo-500/20 shadow-lg">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                            <BrainCircuit className="h-6 w-6" />
                        </div>
                        <span className="text-sm font-medium text-indigo-500 uppercase tracking-wider">AI Studio</span>
                    </div>
                    <CardTitle>Müfredat Sihirbazı</CardTitle>
                    <CardDescription>
                        Konuyu gir, AI senin için en iyi öğrenme yolunu çıkarsın.
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleGenerate}>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="topic">Konu veya Başlık</Label>
                            <Input
                                id="topic"
                                placeholder="Örn: Newton Hareket Yasaları, Fransız Devrimi, CSS Grid..."
                                required
                                className="text-lg"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="goal">Öğrenme Hedefi (Opsiyonel)</Label>
                            <Textarea
                                id="goal"
                                placeholder="Örn: Sınava hazırlanıyorum, sadece özet geç..."
                            />
                        </div>

                        <div className="pt-4 border-t border-dashed">
                            <Label className="mb-2 block">Kaynak Dosya (PDF/PPTX)</Label>
                            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer border-muted-foreground/25">
                                <UploadCloud className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                <div className="text-sm text-muted-foreground">
                                    <span className="font-semibold text-primary">Yüklemek için tıkla</span> veya sürükle bırak
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">PDF, DOCX (Maks. 10MB)</p>
                            </div>
                        </div>

                        <Alert className="bg-indigo-50 text-indigo-900 border-indigo-200 dark:bg-indigo-900/10 dark:text-indigo-200 dark:border-indigo-800">
                            <BrainCircuit className="h-4 w-4" />
                            <AlertTitle>Maliyet Tahmini</AlertTitle>
                            <AlertDescription>
                                Plan oluşturma: <strong>5 Token</strong>. Onaylanan her bölüm: <strong>20 Token</strong>.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Müfredat Hazırlanıyor...
                                </>
                            ) : (
                                <>
                                    <BrainCircuit className="mr-2 h-5 w-5" />
                                    Planı Oluştur (5 Token)
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
