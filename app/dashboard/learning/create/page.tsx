"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BrainCircuit, Loader2, UploadCloud, CheckCircle2, XCircle, Plus, Minus, Settings2 } from "lucide-react"

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

interface SyllabusItem {
    order: number;
    title: string;
    overview: string;
    estimatedMinutes: number;
}

export default function CreateLearningPlanPage() {
    const router = useRouter()
    const { t } = useTranslation()

    const [isLoading, setIsLoading] = useState(false)
    const [step, setStep] = useState<"input" | "generating" | "review">("input")
    const [errorMsg, setErrorMsg] = useState("")

    // Form states
    const [topic, setTopic] = useState("")
    const [goal, setGoal] = useState("")
    const [depth, setDepth] = useState<"shallow" | "standard" | "deep">("standard")

    // Generated Syllabus
    const [syllabus, setSyllabus] = useState<SyllabusItem[]>([])
    const [estimatedTokens, setEstimatedTokens] = useState<number | null>(null)

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMsg("")

        if (!topic.trim()) {
            setErrorMsg("Topic is required.")
            return
        }

        setIsLoading(true)
        setStep("generating")

        try {
            const res = await fetch("/api/ai/learning-path/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic, goal, depth })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Failed to generate syllabus")
            }

            if (data.syllabus) {
                setSyllabus(data.syllabus)
                setEstimatedTokens(data.metadata?.estimatedInputTokens)
                setStep("review")
            } else {
                throw new Error("No syllabus returned from AI.")
            }
        } catch (error: unknown) {
            console.error(error)
            const msg = error instanceof Error ? error.message : "An unexpected error occurred."
            setErrorMsg(msg)
            setStep("input")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDynamicAction = async (action: string) => {
        // Here we could re-call to AI with instructions like "make this more technical"
        // For now, let's keep it visually interactive or mock a modification
        setIsLoading(true)

        try {
            // Suppose we have a feature in future to re-generate with a specific instruction modifier
            // We just mock the reload behavior for now to show the user it is working
            await new Promise(res => setTimeout(res, 2000))

            if (action === "expand") {
                // Mock behavior:
                // We will just tell User it's expanded (In reality this will be an AI call)
                alert("This will call the AI to add more sub-topics.")
            } else if (action === "condense") {
                alert("This will call the AI to summarize and shorten the current syllabus.")
            } else if (action === "technical") {
                alert("This will call the AI to make the outline more technical and advanced.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleRemoveItem = (indexToRemove: number) => {
        setSyllabus(prev => prev.filter((_, i) => i !== indexToRemove))
    }

    const handleStartJourney = async () => {
        setIsLoading(true);
        setErrorMsg("");

        try {
            const res = await fetch("/api/ai/learning-path/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic,
                    depth,
                    syllabus
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to start learning journey");
            }

            if (data.journeyId) {
                // Redirect user to the active learning session
                router.push(`/dashboard/learning/j/${data.journeyId}`);
            } else {
                throw new Error("Invalid response missing journey ID");
            }

        } catch (error: any) {
            console.error(error);
            setErrorMsg(error.message || "An unexpected error occurred while starting the journey.");
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8 text-black dark:text-gray-100">
            <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">{t('creation.title') || "AI Learning Wizard"}</h1>
                <p className="text-muted-foreground">
                    {t('creation.description') || "Describe what you want to learn, and let the AI generate a complete learning pathway."}
                </p>
            </div>

            {errorMsg && (
                <Alert variant="destructive" className="mb-6">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errorMsg}</AlertDescription>
                </Alert>
            )}

            {step === "input" && (
                <Card className="border-indigo-500/20 shadow-lg bg-card">
                    <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                                <BrainCircuit className="h-6 w-6" />
                            </div>
                            <span className="text-sm font-medium text-indigo-500 uppercase tracking-wider">AI Studio</span>
                        </div>
                        <CardTitle>{t('creation.wizardTitle') || "Configure Your Journey"}</CardTitle>
                        <CardDescription>
                            {t('creation.wizardDescription') || "Enter a topic and learning goal to begin."}
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleGenerate}>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="topic">{t('creation.topicLabel') || "Topic"}</Label>
                                <Input
                                    id="topic"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder={t('creation.topicPlaceholder') || "E.g. The Cold War, Next.js Routing, etc."}
                                    required
                                    className="text-lg bg-background"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="goal">{t('creation.goalLabel') || "Personal Goal"}</Label>
                                <Textarea
                                    id="goal"
                                    value={goal}
                                    onChange={(e) => setGoal(e.target.value)}
                                    placeholder={t('creation.goalPlaceholder') || "What do you want to achieve?"}
                                    className="bg-background"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>{t('creation.depthLabel') || "Learning Depth"}</Label>
                                <Select value={depth} onValueChange={(val: "shallow" | "standard" | "deep") => setDepth(val)}>
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder={t('creation.depthStandard')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="shallow">⚡ Shallow (Quick Overview)</SelectItem>
                                        <SelectItem value="standard">📚 Standard (Balanced)</SelectItem>
                                        <SelectItem value="deep">🔬 Deep (Comprehensive)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="pt-4 border-t border-dashed border-border">
                                <Label className="mb-2 block">{t('creation.fileLabel') || "Upload Material"} <span className="text-muted-foreground text-xs ml-2">({t('common.optional') || "optional"})</span></Label>
                                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer border-muted-foreground/25 bg-background">
                                    <UploadCloud className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                    <div className="text-sm text-muted-foreground">
                                        <span className="font-semibold text-primary">{t('creation.uploadClick') || "Click to upload"}</span> {t('creation.uploadDrag') || "or drag and drop"}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{t('creation.fileTypes') || "PDF, DOCX, TXT up to 10MB"}</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <BrainCircuit className="mr-2 h-5 w-5" />
                                        Generate Curriculum
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            )}

            {step === "generating" && (
                <Card className="border-indigo-500/20 shadow-lg py-12 text-center bg-card">
                    <CardContent className="space-y-6 flex flex-col items-center justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
                            <BrainCircuit className="h-16 w-16 text-indigo-500 animate-pulse relative z-10" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">{t('creation.generating') || "Mapping the Knowledge..."}</h2>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                AI is analyzing your topic and determining the best pedagogical path. Please wait a few seconds.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === "review" && (
                <Card className="border-emerald-500/20 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 bg-card">
                    <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <span className="text-sm font-medium text-emerald-500 uppercase tracking-wider">Plan Ready</span>
                        </div>
                        <CardTitle>{t('creation.syllabusTitle') || "Your Learning Syllabus"}</CardTitle>
                        <CardDescription>
                            Review your generated curriculum below. You can modify it or start learning immediately.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Dynamic Action Buttons */}
                        <div className="flex flex-wrap gap-2 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50">
                            <span className="text-xs font-semibold text-slate-500 uppercase w-full mb-1">AI Modifiers ({estimatedTokens} initial tokens used)</span>
                            <Button variant="outline" size="sm" onClick={() => handleDynamicAction('expand')} disabled={isLoading} className="bg-background">
                                <Plus className="h-4 w-4 mr-1" /> Expand
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDynamicAction('condense')} disabled={isLoading} className="bg-background">
                                <Minus className="h-4 w-4 mr-1" /> Condense
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDynamicAction('technical')} disabled={isLoading} className="bg-background">
                                <Settings2 className="h-4 w-4 mr-1" /> Make Technical
                            </Button>
                        </div>

                        {/* Syllabus List */}
                        <div className="rounded-xl border border-border divide-y divide-border relative overflow-hidden bg-background">
                            {isLoading && (
                                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                                </div>
                            )}
                            {syllabus.map((item, idx) => (
                                <div key={idx} className="p-4 flex items-start justify-between group hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold shrink-0 mt-0.5 text-foreground">
                                            {item.order || idx + 1}
                                        </div>
                                        <div className="flex-1 pr-4">
                                            <div className="font-semibold text-foreground">{item.title}</div>
                                            <div className="text-sm text-muted-foreground mt-1">{item.overview}</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                            ~{item.estimatedMinutes} mins
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                                            onClick={() => handleRemoveItem(idx)}
                                        >
                                            <XCircle className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {syllabus.length === 0 && (
                                <div className="p-8 text-center text-muted-foreground">List is empty.</div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border mt-4">
                        <Button variant="outline" className="w-full sm:w-auto" onClick={() => setStep("input")} disabled={isLoading}>
                            {t('common.back') || "Back"}
                        </Button>
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 text-base" disabled={isLoading} onClick={handleStartJourney}>
                            <BrainCircuit className="mr-2 h-5 w-5" />
                            {t('creation.startLearning') || "Start This Journey"}
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    )
}
