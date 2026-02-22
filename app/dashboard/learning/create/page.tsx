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
import { useTranslation } from "@/lib/i18n/i18n"

export default function CreateLearningPlanPage() {
    const router = useRouter()
    const { t } = useTranslation()
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
                <h1 className="text-3xl font-bold tracking-tight">{t('creation.title')}</h1>
                <p className="text-muted-foreground">
                    {t('creation.description')}
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
                    <CardTitle>{t('creation.wizardTitle')}</CardTitle>
                    <CardDescription>
                        {t('creation.wizardDescription')}
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleGenerate}>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="topic">{t('creation.topicLabel')}</Label>
                            <Input
                                id="topic"
                                placeholder={t('creation.topicPlaceholder')}
                                required
                                className="text-lg"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="goal">{t('creation.goalLabel')}</Label>
                            <Textarea
                                id="goal"
                                placeholder={t('creation.goalPlaceholder')}
                            />
                        </div>

                        <div className="pt-4 border-t border-dashed">
                            <Label className="mb-2 block">{t('creation.fileLabel')}</Label>
                            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer border-muted-foreground/25">
                                <UploadCloud className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                <div className="text-sm text-muted-foreground">
                                    <span className="font-semibold text-primary">{t('creation.uploadClick')}</span> {t('creation.uploadDrag')}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{t('creation.fileTypes')}</p>
                            </div>
                        </div>

                        <Alert className="bg-indigo-50 text-indigo-900 border-indigo-200 dark:bg-indigo-900/10 dark:text-indigo-200 dark:border-indigo-800">
                            <BrainCircuit className="h-4 w-4" />
                            <AlertTitle>{t('creation.costEstimate')}</AlertTitle>
                            <AlertDescription>
                                {t('creation.planCost', { count: 5 })} {t('creation.sectionCost', { count: 20 })}
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    {t('creation.generating')}
                                </>
                            ) : (
                                <>
                                    <BrainCircuit className="mr-2 h-5 w-5" />
                                    {t('creation.createPlan', { count: 5 })}
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
