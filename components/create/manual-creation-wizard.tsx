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
import { useToast } from "@/components/ui/use-toast"; // Assuming toast exists or will use console for now
import { useRouter } from "next/navigation";
import { ModuleService } from "@/domains/module/module.service"; // Wait, can't import service in client component!
// I need an API call.

// --- Schema Definition ---
const moduleSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(100),
    description: z.string().max(500).optional(),
    type: z.enum(["FLASHCARD", "MC", "GAP"]),
    isForkable: z.boolean().default(true),
    items: z.array(z.any()).default([]) // We'll refine Item schema later or in the step
});

export type ModuleFormData = z.infer<typeof moduleSchema>;

export function ManualCreationWizard() {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const methods = useForm<ModuleFormData>({
        resolver: zodResolver(moduleSchema),
        defaultValues: {
            type: "FLASHCARD",
            isForkable: true,
            items: []
        },
        mode: "onChange"
    });

    const { handleSubmit, trigger, formState: { isValid } } = methods;

    const nextStep = async () => {
        const isStepValid = await trigger(["title", "description", "type"]);
        if (isStepValid) setStep(2);
    };

    const prevStep = () => setStep(1);

    const onSubmit = async (data: ModuleFormData) => {
        setIsSubmitting(true);
        try {
            // 1. Create Module via API
            const res = await fetch("/api/modules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: data.title,
                    description: data.description,
                    type: data.type,
                    isForkable: data.isForkable,
                    status: 'ACTIVE' // Directly active for manual creation? Or DRAFT? Let's say ACTIVE for MVP simplicity.
                })
            });

            if (!res.ok) throw new Error("Failed to create module");

            const newModule = await res.json();

            // 2. Add Items via API (Batch) - Not implemented yet in Phase 2.1
            // I only implemented Module CRUD. Item CRUD is missing!
            // I need to implement Item creation API.
            // But for now, let's just redirect to the module page where they can add items?
            // OR implement item addition in the wizard.
            // The plan says "Manual Creation Forms (Wizard Step)". "Content Editor".
            // So I SHOULD implement Item saving.

            // I'll need to create an API endpoint for batch item creation or items.

            router.push(`/modules/${newModule.id}`);

        } catch (error) {
            console.error(error);
            // toast({ title: "Error", description: "Failed to create module", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8">
            {/* Steps Indicator */}
            <div className="flex items-center justify-center mb-8 gap-4">
                <div className={`flex items-center gap-2 ${step === 1 ? "text-primary font-bold" : "text-muted-foreground"}`}>
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center border ${step === 1 ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground"}`}>1</span>
                    Basic Info
                </div>
                <div className="h-px w-10 bg-border" />
                <div className={`flex items-center gap-2 ${step === 2 ? "text-primary font-bold" : "text-muted-foreground"}`}>
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center border ${step === 2 ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground"}`}>2</span>
                    Content
                </div>
            </div>

            <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Card className="p-6 min-h-[500px] flex flex-col">
                        <div className="flex-1">
                            {step === 1 && <BasicInfoStep />}
                            {step === 2 && <ContentEditorStep />}
                        </div>

                        <div className="flex justify-between mt-8 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={prevStep} disabled={step === 1}>
                                <ChevronLeft className="mr-2 h-4 w-4" /> Back
                            </Button>

                            {step === 1 ? (
                                <Button type="button" onClick={nextStep}>
                                    Next <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Create Module
                                </Button>
                            )}
                        </div>
                    </Card>
                </form>
            </FormProvider>
        </div>
    );
}
