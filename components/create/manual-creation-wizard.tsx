"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BasicInfoStep } from "./basic-info-step";
import { ContentEditorStep } from "./content-editor-step";
import { ChevronRight, ChevronLeft, Save, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

// --- Schema Definition ---
const moduleSchema = z.object({
    title: z.string().min(3, "Başlık en az 3 karakter olmalıdır").max(100),
    description: z.string().max(500).optional(),
    type: z.enum(["FLASHCARD", "MC", "GAP", "TRUE_FALSE"]),
    category: z.string().optional(),
    subCategory: z.string().optional(),
    isForkable: z.boolean().default(true),
    items: z.array(z.any()).default([])
});

export type ModuleFormData = z.input<typeof moduleSchema>;

export function ManualCreationWizard() {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const methods = useForm<ModuleFormData>({
        resolver: zodResolver(moduleSchema),
        defaultValues: {
            type: "FLASHCARD",
            isForkable: true,
            items: [],
            category: "",
            subCategory: ""
        },
        mode: "onChange"
    });

    const { handleSubmit, trigger } = methods;

    const nextStep = async () => {
        const isStepValid = await trigger(["title", "type", "isForkable"]); // Only trigger required fields for step 1
        console.log("Step 1 Valid:", isStepValid); // Debugging
        if (isStepValid) setStep(2);
    };

    const prevStep = () => setStep(1);

    const onSubmit = async (data: ModuleFormData) => {
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/modules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: data.title,
                    description: data.description,
                    type: data.type,
                    isForkable: data.isForkable,
                    status: 'ACTIVE',
                    items: data.items,
                    category: data.category,
                    subCategory: data.subCategory
                })
            });

            if (!res.ok) throw new Error("Modül oluşturulamadı");

            const newModule = await res.json();
            router.push(`/dashboard/library`); // Redirect to library after creation

        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Yeni Modül Oluştur
            </h1>

            {/* Steps Indicator */}
            <div className="flex items-center justify-center mb-8 gap-4">
                <div className={`flex items-center gap-2 ${step === 1 ? "text-primary font-bold" : "text-muted-foreground"}`}>
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center border ${step === 1 ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground"}`}>1</span>
                    Temel Bilgiler
                </div>
                <div className="h-px w-10 bg-border" />
                <div className={`flex items-center gap-2 ${step === 2 ? "text-primary font-bold" : "text-muted-foreground"}`}>
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center border ${step === 2 ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground"}`}>2</span>
                    İçerik
                </div>
            </div>

            <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Card className="p-6 min-h-[500px] flex flex-col border-2">
                        <div className="flex-1">
                            {step === 1 && <BasicInfoStep />}
                            {step === 2 && <ContentEditorStep />}
                        </div>

                        <div className="flex justify-between mt-8 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={prevStep} disabled={step === 1}>
                                <ChevronLeft className="mr-2 h-4 w-4" /> Geri
                            </Button>

                            {step === 1 ? (
                                <Button type="button" onClick={nextStep}>
                                    İleri <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Modülü Oluştur
                                </Button>
                            )}
                        </div>
                    </Card>
                </form>
            </FormProvider>
        </div>
    );
}
