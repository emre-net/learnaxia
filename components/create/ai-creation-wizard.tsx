"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Loader2, Save, Trash2, CheckCircle2, FileText, UploadCloud, BookOpen, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/lib/i18n/i18n";
import { v4 as uuidv4 } from 'uuid';
import { calculateAITokensAndCost } from "@/lib/utils/token-calculator";

// --- Schema ---
const aiConfigSchema = z.object({
    topic: z.string().min(10, "Text must be at least 10 characters").max(20000), // Increased for large docs
    count: z.number().min(3).max(20),
    type: z.enum(["FLASHCARD", "MC", "GAP", "TF"]), // Changed to single type
    focusMode: z.enum(["detailed", "summary", "key_concepts", "auto"])
});

type AIConfig = z.infer<typeof aiConfigSchema>;

export function AICreationWizard() {
    const { t } = useTranslation();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();

    const [step, setStep] = useState<"CONFIG" | "GENERATING" | "REVIEW">("CONFIG");
    const [generatedItems, setGeneratedItems] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [inputType, setInputType] = useState<"TEXT" | "FILE">("TEXT");
    const [isAutoCount, setIsAutoCount] = useState(false);

    const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/file/extract", {
                method: "POST",
                body: formData
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to extract document");
            }

            const data = await res.json();

            // Sınır koruması yapalım (örn: 20000)
            const textToSave = data.text ? data.text.substring(0, 19500) : "";

            setValue("topic", textToSave, { shouldValidate: true, shouldDirty: true });

            toast({
                title: t("common.success"),
                description: `${file.name} belgesi okundu ve analize hazır.`,
            });
        } catch (error: any) {
            console.error("Extraction error:", error);
            setValue("topic", ""); // Temizle
            toast({
                title: t("common.error"),
                description: error.message || "Belge okunurken bir hata oluştu.",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AIConfig>({
        resolver: zodResolver(aiConfigSchema),
        defaultValues: {
            topic: "",
            count: 5,
            type: "FLASHCARD", // Default single type
            focusMode: "auto"
        }
    });

    const config = watch();

    // Dynamically calculate estimated cost based on what the user types
    const tokenEstimate = calculateAITokensAndCost({
        text: config.topic || "",
        targetCount: isAutoCount ? -1 : config.count,
        isVision: false
    });

    useEffect(() => {
        const sourceText = searchParams?.get('sourceText');
        const storageText = typeof window !== 'undefined' ? sessionStorage.getItem('magic_wand_text') : null;

        if (sourceText || storageText) {
            setInputType('TEXT');
            setValue('topic', sourceText || storageText || "");
            if (storageText && typeof window !== 'undefined') {
                sessionStorage.removeItem('magic_wand_text');
            }
        }
    }, [searchParams, setValue]);

    // ... (onFileUpload remains same) ...

    const onGenerate = async (data: AIConfig) => {
        setStep("GENERATING");
        try {
            // Adapt single type to API expectation (array)
            const apiData = {
                ...data,
                count: isAutoCount ? -1 : data.count,
                types: [data.type],
                focusMode: data.focusMode
            };

            const res = await fetch("/api/ai/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(apiData)
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Generation failed");
            }

            const result = await res.json();
            // Assign UUIDs to generated items
            const itemsWithIds = result.items.map((item: any) => ({
                ...item,
                id: uuidv4()
            }));
            setGeneratedItems(itemsWithIds);
            setStep("REVIEW");
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Generation Failed",
                description: error.message,
                variant: "destructive"
            });
            setStep("CONFIG");
        }
    };

    const onSaveModule = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/modules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: config.topic.substring(0, 50) + (config.topic.length > 50 ? "..." : ""),
                    description: `AI Generated module from ${inputType === 'FILE' ? 'Document' : 'Text'}`,
                    type: config.type, // Use selected type!
                    isForkable: true,
                    status: 'ACTIVE',
                    items: generatedItems
                })
            });

            if (!res.ok) throw new Error("Failed to save module");

            const newModule = await res.json();
            toast({
                title: "Success! 🎉",
                description: "Module created successfully.",
            });
            router.push(`/modules/${newModule.id}`);

        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to save module", variant: "destructive" });
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8">
            {step === "CONFIG" && (
                <Card className="border-purple-500/20 shadow-lg shadow-purple-500/10">
                    {/* Header... */}
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <Sparkles className="h-6 w-6 text-purple-500" />
                            {t("creation.aiConfig")}
                        </CardTitle>
                        <CardDescription>
                            {t("creation.aiDescription")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form id="ai-form" onSubmit={handleSubmit(onGenerate)} className="space-y-6">

                            {/* Input Source Tabs skipped for brevity implementation ... */}
                            <Tabs value={inputType} onValueChange={(v) => setInputType(v as any)} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="TEXT">{t("creation.textTab")}</TabsTrigger>
                                    <TabsTrigger value="FILE">{t("creation.fileTab")}</TabsTrigger>
                                </TabsList>
                                <TabsContent value="TEXT" className="pt-4">
                                    <div className="space-y-2">
                                        <Label>{t("creation.topicContentLabel")}</Label>
                                        <Textarea
                                            {...register("topic")}
                                            placeholder={t("creation.topicContentPlaceholder")}
                                            className="min-h-[150px] text-base"
                                        />
                                        <div className="flex justify-between items-center mt-1">
                                            {tokenEstimate.willHitRateLimit ? (
                                                <p className="text-xs text-red-500 font-semibold animate-pulse">⚠️ Metin çok uzun! Boyutu sınırları aşıyor.</p>
                                            ) : (
                                                <p className="text-xs text-muted-foreground">≈ {tokenEstimate.totalTokens} Tokens</p>
                                            )}
                                            <p className="text-xs text-muted-foreground text-right">{config.topic?.length || 0}/20000 chars</p>
                                        </div>
                                        {errors.topic && <p className="text-red-500 text-sm">{errors.topic.message}</p>}
                                    </div>
                                </TabsContent>
                                <TabsContent value="FILE" className="pt-4 space-y-4">
                                    {/* ... File Upload UI ... */}
                                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-muted/5 transition-colors">
                                        <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
                                        <Label htmlFor="doc-upload" className="cursor-pointer">
                                            <span className="text-primary font-semibold hover:underline">{t("creation.uploadClick")}</span> {t("creation.uploadDrag")}
                                            <Input
                                                id="doc-upload"
                                                type="file"
                                                accept=".pdf,.txt,.pptx,.docx"
                                                className="hidden"
                                                onChange={onFileUpload}
                                                disabled={isUploading}
                                            />
                                        </Label>
                                        <p className="text-xs text-muted-foreground mt-2">{t("creation.fileTypes")}</p>
                                    </div>

                                    {isUploading && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                                            <Loader2 className="h-4 w-4 animate-spin" /> {t("creation.extractingText")}
                                        </div>
                                    )}

                                    {inputType === 'FILE' && config.topic.length > 0 && !isUploading && (
                                        <div className="bg-muted p-4 rounded-md">
                                            <div className="flex items-center gap-2 mb-2 font-medium text-sm">
                                                <FileText className="h-4 w-4" /> {t("creation.extractedContext")}
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-4">{config.topic}</p>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>

                            {/* Content Type - Single Selection */}
                            <div className="space-y-3">
                                <Label>Content Type</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    {["FLASHCARD", "MC", "GAP", "TF"].map((type) => (
                                        <div
                                            key={type}
                                            className={`flex items-center space-x-2 border p-3 rounded-lg cursor-pointer transition-all ${config.type === type ? 'border-purple-500 bg-purple-500/5 ring-1 ring-purple-500' : 'hover:bg-muted/50'}`}
                                            onClick={() => setValue("type", type as any)}
                                        >
                                            <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${config.type === type ? 'border-purple-500' : 'border-muted-foreground'}`}>
                                                {config.type === type && <div className="h-2 w-2 rounded-full bg-purple-500" />}
                                            </div>
                                            <label className="text-sm font-medium leading-none cursor-pointer w-full">
                                                {type === 'MC' ? t("creation.mcLabel") : type === 'TF' ? t("creation.tfLabel") : type === 'GAP' ? t("creation.gapLabel") : t("creation.flashcardsLabel")}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                {errors.type && <p className="text-red-500 text-sm">{errors.type.message}</p>}
                            </div>

                            {/* Focus Mode - Extraction Strategy */}
                            <div className="space-y-3">
                                <Label className="flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-purple-500" />
                                    AI Focus Mode
                                </Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: 'auto', label: 'Auto (AI Kararı)', desc: 'AI metne en uygun stratejiyi seçer' },
                                        { id: 'key_concepts', label: 'Key Concepts', desc: 'Sadece ana konseptleri / tanımları alır' },
                                        { id: 'detailed', label: 'Detailed', desc: 'En ince detaylara kadar iner' },
                                        { id: 'summary', label: 'Summary', desc: 'Yüksek seviye özet çıkarır' }
                                    ].map((mode) => (
                                        <div
                                            key={mode.id}
                                            className={cn(
                                                "border p-3 rounded-lg cursor-pointer transition-all flex flex-col gap-1 w-full",
                                                config.focusMode === mode.id
                                                    ? "border-purple-500 bg-purple-500/5 ring-1 ring-purple-500"
                                                    : "hover:bg-muted/50 border-border"
                                            )}
                                            onClick={() => setValue("focusMode", mode.id as any)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">{mode.label}</span>
                                                <div className={cn(
                                                    "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                                                    config.focusMode === mode.id ? "border-purple-500" : "border-muted-foreground"
                                                )}>
                                                    {config.focusMode === mode.id && <div className="h-2 w-2 rounded-full bg-purple-500" />}
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground">{mode.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Count */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label>{t("creation.itemCountLabel")}</Label>
                                    <div className="flex items-center space-x-2">
                                        <Switch id="auto-count" checked={isAutoCount} onCheckedChange={setIsAutoCount} />
                                        <Label htmlFor="auto-count" className="text-xs font-normal cursor-pointer hover:text-purple-600 transition-colors">{t("creation.autoCount")}</Label>
                                        {!isAutoCount && <span className="font-bold text-lg ml-2 w-6 text-right">{config.count}</span>}
                                    </div>
                                </div>
                                {!isAutoCount && (
                                    <Slider
                                        value={[config.count]}
                                        onValueChange={(val) => setValue("count", val[0])}
                                        min={3}
                                        max={20}
                                        step={1}
                                    />
                                )}
                            </div>

                            <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-purple-500" />
                                    <span className="text-sm font-medium">{t("creation.costEstimate")}</span>
                                </div>
                                <span className={cn(
                                    "font-bold",
                                    tokenEstimate.willHitRateLimit ? "text-red-500" : "text-purple-600"
                                )}>
                                    {tokenEstimate.willHitRateLimit ? "Sınır Aşıldı" : `${tokenEstimate.recommendedCost} AXIA`}
                                </span>
                            </div>

                        </form>
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            form="ai-form"
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:bg-purple-400"
                            size="lg"
                            disabled={isUploading || tokenEstimate.willHitRateLimit || (inputType === 'FILE' && config.topic.length < 10)}
                        >
                            <Sparkles className="mr-2 h-4 w-4" /> {t("creation.generateButton")}
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {step === "GENERATING" && (
                <div className="text-center py-20 space-y-6 animate-pulse">
                    <div className="relative">
                        <div className="absolute inset-0 bg-purple-500 blur-3xl opacity-20 rounded-full h-32 w-32 mx-auto"></div>
                        <Sparkles className="h-20 w-20 text-purple-500 mx-auto animate-spin-slow relative z-10" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">{t("creation.generatingContent")}</h2>
                        <p className="text-muted-foreground mt-2">{t("creation.analyzingContent", { type: inputType === 'FILE' ? 'document' : 'topic' })}</p>
                    </div>
                </div>
            )}

            {step === "REVIEW" && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">{t("creation.reviewContent")}</h2>
                        <Button variant="outline" onClick={() => setStep("CONFIG")}>{t("common.back")}</Button>
                    </div>

                    <div className="grid gap-4">
                        {generatedItems.map((item, idx) => (
                            <Card key={item.id || idx} className="relative group hover:border-purple-500/50 transition-colors">
                                <CardContent className="p-4 grid gap-1">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-2">
                                            <span className="text-xs font-bold px-2 py-1 bg-muted rounded uppercase tracking-wider">{item.type}</span>
                                            {item.sourceContext && (
                                                <span className="text-xs flex items-center font-medium px-2 py-1 bg-blue-500/10 text-blue-600 rounded">
                                                    <BookOpen className="h-3 w-3 mr-1" /> {item.sourceContext}
                                                </span>
                                            )}
                                        </div>
                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-red-500" onClick={() => setGeneratedItems(items => items.filter((t) => t.id !== item.id))}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>

                                    {item.type === 'FLASHCARD' && (
                                        <div className="mt-2">
                                            <p className="font-semibold text-lg">{item.front}</p>
                                            <div className="h-px bg-border my-2" />
                                            <p className="text-muted-foreground">{item.back}</p>
                                        </div>
                                    )}

                                    {item.type === 'MC' && (
                                        <div className="mt-2">
                                            <p className="font-medium">{item.question}</p>
                                            <ul className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                                {item.options.map((opt: string, i: number) => (
                                                    <li key={i} className={`p-2 rounded border ${opt === item.answer ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400' : 'bg-muted/50'}`}>
                                                        {opt}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {item.type === 'GAP' && (
                                        <div className="mt-2">
                                            <p className="font-medium bg-muted/30 p-3 rounded-md font-mono text-sm">{item.text}</p>
                                            <p className="text-xs text-muted-foreground mt-1">Answers: {item.answers.join(", ")}</p>
                                        </div>
                                    )}

                                    {item.type === 'TF' && (
                                        <div className="mt-2">
                                            <p className="font-medium">{item.statement}</p>
                                            <p className={`mt-1 font-bold ${item.answer === 'True' ? 'text-green-500' : 'text-red-500'}`}>{item.answer}</p>
                                        </div>
                                    )}

                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="flex justify-end gap-4 py-8 border-t">
                        <div className="flex-1 text-muted-foreground text-sm flex items-center">
                            <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                            {t("creation.itemsReady", { count: generatedItems.length.toString() })}
                        </div>
                        <Button variant="ghost" onClick={() => setStep("CONFIG")}>{t("common.cancel")}</Button>
                        <Button onClick={onSaveModule} disabled={isSaving || generatedItems.length === 0} className="bg-green-600 hover:bg-green-700 text-white min-w-[150px]">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {t("creation.save")}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
