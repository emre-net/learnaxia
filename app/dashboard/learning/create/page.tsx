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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { CheckCircle2, ChevronRight, XCircle, Plus, Minus, Settings2 } from "lucide-react"

export default function CreateLearningPlanPage() {
    const router = useRouter()
    const { t } = useTranslation()
    const [isLoading, setIsLoading] = useState(false)
    const [step, setStep] = useState<"input" | "generating" | "review">("input")
    const [depth, setDepth] = useState<"shallow" | "standard" | "deep">("standard")

    // Mock syllabus for UI Development
    const [mockSyllabus, setMockSyllabus] = useState([
        "Giriş ve Temel Kavramlar",
        "Tarihçe ve Gelişim",
        "Ana Bileşenler ve Mimari",
        "İleri Seviye Optimizasyonlar"
    ])

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setStep("generating")
        // TODO: Call API to generate syllabus based on text, file and depth
        setTimeout(() => {
            setIsLoading(false)
            setStep("review") // Mock flow transition
        }, 2000)
    }

    const handleDynamicAction = (action: string) => {
        setIsLoading(true)
        // Mock API call to update syllabus
        setTimeout(() => {
            setIsLoading(false)
            if (action === "expand") {
                setMockSyllabus(prev => [...prev.slice(0, 2), "Ekstra Ara Konu 1", "Ekstra Ara Konu 2", ...prev.slice(2)])
            } else if (action === "condense") {
                setMockSyllabus(prev => prev.slice(0, 2))
            }
        }, 1500)
    }

    const handleRemoveItem = (indexToRemove: number) => {
        setMockSyllabus(prev => prev.filter((_, i) => i !== indexToRemove))
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">{t('creation.title')}</h1>
                <p className="text-muted-foreground">
                    {t('creation.description')}
                </p>
            </div>

            {step === "input" && (
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

                            <div className="space-y-2">
                                <Label>{t('creation.depthLabel')}</Label>
                                <Select value={depth} onValueChange={(val: any) => setDepth(val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('creation.depthStandard')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="shallow">⚡ {t('creation.depthShallow')}</SelectItem>
                                        <SelectItem value="standard">📚 {t('creation.depthStandard')}</SelectItem>
                                        <SelectItem value="deep">🔬 {t('creation.depthDeep')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground mt-1">{t('creation.depthDescription')}</p>
                            </div>

                            <div className="pt-4 border-t border-dashed">
                                <Label className="mb-2 block">{t('creation.fileLabel')} <span className="text-muted-foreground text-xs ml-2">({t('common.optional')})</span></Label>
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
                                    {t('creation.planCost', { count: 3 })} {t('creation.sectionCost', { count: 12 })}
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
                                        {t('creation.createPlan', { count: 3 })}
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            )}

            {step === "generating" && (
                <Card className="border-indigo-500/20 shadow-lg py-12 text-center">
                    <CardContent className="space-y-6 flex flex-col items-center justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
                            <BrainCircuit className="h-16 w-16 text-indigo-500 animate-pulse relative z-10" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">{t('creation.generating')}</h2>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                AI is analyzing your topic and determining the best pedagogical path...
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === "review" && (
                <Card className="border-emerald-500/20 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <span className="text-sm font-medium text-emerald-500 uppercase tracking-wider">Plan Ready</span>
                        </div>
                        <CardTitle>{t('creation.syllabusTitle')}</CardTitle>
                        <CardDescription>
                            {t('creation.syllabusDesc')}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Dynamic Action Buttons */}
                        <div className="flex flex-wrap gap-2 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50">
                            <span className="text-xs font-semibold text-slate-500 uppercase w-full mb-1">AI Modifiers</span>
                            <Button variant="outline" size="sm" onClick={() => handleDynamicAction('expand')} disabled={isLoading} className="bg-background">
                                <Plus className="h-4 w-4 mr-1" /> {t('creation.syllabusExpand')}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDynamicAction('condense')} disabled={isLoading} className="bg-background">
                                <Minus className="h-4 w-4 mr-1" /> {t('creation.syllabusCondense')}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDynamicAction('technical')} disabled={isLoading} className="bg-background">
                                <Settings2 className="h-4 w-4 mr-1" /> {t('creation.syllabusTechnical')}
                            </Button>
                        </div>

                        {/* Syllabus List */}
                        <div className="rounded-xl border divide-y relative overflow-hidden">
                            {isLoading && (
                                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                                </div>
                            )}
                            {mockSyllabus.map((item, idx) => (
                                <div key={idx} className="p-4 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold shrink-0 mt-0.5">
                                            {idx + 1}
                                        </div>
                                        <div className="font-medium">{item}</div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleRemoveItem(idx)}
                                    >
                                        <XCircle className="h-5 w-5" />
                                    </Button>
                                </div>
                            ))}
                            {mockSyllabus.length === 0 && (
                                <div className="p-8 text-center text-muted-foreground">List is empty.</div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t mt-4">
                        <Button variant="outline" className="w-full sm:w-auto" onClick={() => setStep("input")}>
                            {t('common.back')}
                        </Button>
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-11 text-base">
                            <BrainCircuit className="mr-2 h-5 w-5" />
                            {t('creation.startLearning')}
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    )
}
