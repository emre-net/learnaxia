"use client";

import { useState } from "react";
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
import { Sparkles, Loader2, Save, Trash2, CheckCircle2, AlertCircle, FileText, UploadCloud, FileType, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from 'uuid';

// --- Schema ---
const aiConfigSchema = z.object({
    topic: z.string().min(10, "Text must be at least 10 characters").max(20000), // Increased for large docs
    count: z.number().min(3).max(20),
    types: z.array(z.enum(["FLASHCARD", "MC", "GAP", "TF"])).min(1, "Select at least one type")
});

type AIConfig = z.infer<typeof aiConfigSchema>;

export function AICreationWizard() {
    const [step, setStep] = useState<"CONFIG" | "GENERATING" | "REVIEW">("CONFIG");
    const [generatedItems, setGeneratedItems] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [inputType, setInputType] = useState<"TEXT" | "FILE">("TEXT");

    const router = useRouter();
    const { toast } = useToast();

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AIConfig>({
        resolver: zodResolver(aiConfigSchema),
        defaultValues: {
            topic: "",
            count: 5,
            types: ["FLASHCARD", "MC", "GAP", "TF"]
        }
    });

    const config = watch();

    const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = [
            "application/pdf",
            "text/plain",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // docx
        ];

        if (!allowedTypes.includes(file.type)) {
            toast({ title: "Error", description: "Invalid file type. Supported: PDF, TXT, PPTX, DOCX", variant: "destructive" });
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/file/extract", { // Updated endpoint
                method: "POST",
                body: formData
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "File extraction failed");
            }

            const data = await res.json();
            setValue("topic", data.text);

            toast({ title: "Success", description: "Document content extracted successfully!" });
        } catch (error: any) {
            console.error(error);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    const onGenerate = async (data: AIConfig) => {
        setStep("GENERATING");
        try {
            const res = await fetch("/api/ai/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Generation failed");
            }

            const result = await res.json();
            // Assign UUIDs to generated items for stable rendering and manipulation
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
                    type: "FLASHCARD",
                    isForkable: true,
                    status: 'ACTIVE',
                    items: generatedItems // Now includes IDs, but API will ignore them for creation which is fine
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
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <Sparkles className="h-6 w-6 text-purple-500" />
                            AI Configuration
                        </CardTitle>
                        <CardDescription>
                            Tell us what you want to learn, and we'll generate the content.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form id="ai-form" onSubmit={handleSubmit(onGenerate)} className="space-y-6">

                            {/* Input Source Tabs */}
                            <Tabs value={inputType} onValueChange={(v) => setInputType(v as any)} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="TEXT">Text / Topic</TabsTrigger>
                                    <TabsTrigger value="FILE">Upload Document</TabsTrigger>
                                </TabsList>
                                <TabsContent value="TEXT" className="pt-4">
                                    <div className="space-y-2">
                                        <Label>Topic or Text Content</Label>
                                        <Textarea
                                            {...register("topic")}
                                            placeholder="Paste your notes, article text, or just a topic like 'French Revolution'..."
                                            className="min-h-[150px] text-base"
                                        />
                                        <p className="text-xs text-muted-foreground text-right">{config.topic?.length || 0}/20000 chars</p>
                                        {errors.topic && <p className="text-red-500 text-sm">{errors.topic.message}</p>}
                                    </div>
                                </TabsContent>
                                <TabsContent value="FILE" className="pt-4 space-y-4">
                                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-muted/5 transition-colors">
                                        <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
                                        <Label htmlFor="doc-upload" className="cursor-pointer">
                                            <span className="text-primary font-semibold hover:underline">Click to upload</span> or drag and drop
                                            <Input
                                                id="doc-upload"
                                                type="file"
                                                accept=".pdf,.txt,.pptx,.docx"
                                                className="hidden"
                                                onChange={onFileUpload}
                                                disabled={isUploading}
                                            />
                                        </Label>
                                        <p className="text-xs text-muted-foreground mt-2">PDF, TXT, PPTX or DOCX (Max 10MB)</p>
                                    </div>

                                    {isUploading && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                                            <Loader2 className="h-4 w-4 animate-spin" /> Extracting text from document...
                                        </div>
                                    )}

                                    {/* Show Preview if valid text exists from File */}
                                    {inputType === 'FILE' && config.topic.length > 0 && !isUploading && (
                                        <div className="bg-muted p-4 rounded-md">
                                            <div className="flex items-center gap-2 mb-2 font-medium text-sm">
                                                <FileText className="h-4 w-4" /> Extracted Context
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-4">{config.topic}</p>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>

                            {/* Types */}
                            <div className="space-y-3">
                                <Label>Content Types</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    {["FLASHCARD", "MC", "GAP", "TF"].map((type) => (
                                        <div key={type} className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                            <Checkbox
                                                id={type}
                                                checked={config.types.includes(type as any)}
                                                onCheckedChange={(checked) => {
                                                    const current = config.types;
                                                    if (checked) setValue("types", [...current, type as any]);
                                                    else setValue("types", current.filter(t => t !== type));
                                                }}
                                            />
                                            <label htmlFor={type} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer w-full">
                                                {type === 'MC' ? 'Multiple Choice' : type === 'TF' ? 'True/False' : type === 'GAP' ? 'Gap Fill' : 'Flashcard'}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                {errors.types && <p className="text-red-500 text-sm">{errors.types.message}</p>}
                            </div>

                            {/* Count */}
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <Label>Item Count</Label>
                                    <span className="font-bold text-lg">{config.count}</span>
                                </div>
                                <Slider
                                    value={[config.count]}
                                    onValueChange={(val) => setValue("count", val[0])}
                                    min={3}
                                    max={20}
                                    step={1}
                                />
                            </div>

                            <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-purple-500" />
                                    <span className="text-sm font-medium">Estimated Cost</span>
                                </div>
                                {/* Cost from shared constants */}
                                <span className="font-bold text-purple-600">
                                    {inputType === 'FILE' && config.topic.length > 100 ? `${15} AXIA` : `${10} AXIA`}
                                </span>
                            </div>

                        </form>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" form="ai-form" className="w-full bg-purple-600 hover:bg-purple-700 text-white" size="lg" disabled={isUploading || (inputType === 'FILE' && config.topic.length < 10)}>
                            <Sparkles className="mr-2 h-4 w-4" /> Generate Magic
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
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">Creating your content...</h2>
                        <p className="text-muted-foreground mt-2">Our AI is analyzing your {inputType === 'FILE' ? 'document' : 'topic'} and creating questions.</p>
                    </div>
                </div>
            )}

            {step === "REVIEW" && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Review Generated Content</h2>
                        <Button variant="outline" onClick={() => setStep("CONFIG")}>Back</Button>
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
                            {generatedItems.length} items ready to save.
                        </div>
                        <Button variant="ghost" onClick={() => setStep("CONFIG")}>Cancel</Button>
                        <Button onClick={onSaveModule} disabled={isSaving || generatedItems.length === 0} className="bg-green-600 hover:bg-green-700 text-white min-w-[150px]">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Module
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
