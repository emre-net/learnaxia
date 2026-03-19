"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BasicInfoStep } from "./basic-info-step";
import { ContentEditorStep } from "./content-editor-step";
import { ChevronRight, ChevronLeft, Save, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/lib/i18n/i18n";
import { motion, AnimatePresence } from "framer-motion";

// --- Schema Definition ---
const getModuleSchema = (t: any) => z.object({
    title: z.string().min(3, t('validation.titleMin')).max(100, t('validation.titleMax')),
    description: z.string().max(500, t('validation.descriptionMax')).optional(),
    type: z.enum(["FLASHCARD", "MC", "GAP", "TRUE_FALSE"]),
    category: z.string().optional(),
    subCategory: z.string().optional(),
    isForkable: z.boolean().default(true),
    items: z.array(z.any()).default([])
}).superRefine((data, ctx) => {
    if (data.isForkable) {
        if (!data.category || data.category === "") {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: t('validation.categoryRequired'),
                path: ["category"]
            });
        }
        if (!data.subCategory || data.subCategory === "") {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: t('validation.subCategoryRequired'),
                path: ["subCategory"]
            });
        }
    }
});

export type ModuleFormData = z.input<ReturnType<typeof getModuleSchema>>;

export function ManualCreationWizard() {
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false); // CRITICAL FIX: Prevent double-click submission
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("edit");
    const isEditMode = !!editId;
    const { toast } = useToast();

    const moduleSchema = getModuleSchema(t);

    const methods = useForm<ModuleFormData>({
        resolver: zodResolver(moduleSchema),
        defaultValues: {
            title: "",
            description: "",
            type: "FLASHCARD",
            isForkable: true,
            items: [],
            category: "",
            subCategory: ""
        },
        mode: "onChange"
    });

    const { handleSubmit, trigger, reset } = methods;

    // Fetch data if in edit mode
    useEffect(() => {
        if (isEditMode) {
            const fetchModule = async () => {
                try {
                    const res = await fetch(`/api/modules/${editId}`);
                    if (!res.ok) throw new Error(t('validation.failedToLoad'));
                    const data = await res.json();

                    // Populate form
                    reset({
                        title: data.title,
                        description: data.description || "",
                        type: data.type,
                        isForkable: data.isForkable,
                        category: data.category || "",
                        subCategory: data.subCategory || "",
                        items: data.items || []
                    });
                } catch (error) {
                    console.error("Failed to load module for editing:", error);
                    toast({
                        title: t('common.error'),
                        description: t('validation.failedToLoad'),
                        variant: "destructive"
                    });
                }
            };
            fetchModule();
        }
    }, [editId, isEditMode, reset, toast, t]);

    const nextStep = async () => {
        const isStepValid = await trigger(["title", "type", "isForkable", "category", "subCategory"]); // Only trigger required fields for step 1

        if (isStepValid) {
            setIsTransitioning(true); // Lock submission
            setStep(2);
            // Unlock after 500ms to prevent ghost clicks
            setTimeout(() => setIsTransitioning(false), 500);
        }
    };

    const prevStep = () => setStep(1);

    const onSubmit = async (data: ModuleFormData) => {


        // Fix Enter key behavior in Step 1
        if (step === 1) {
            nextStep();
            return;
        }

        // CRITICAL FIX: Prevent premature submission
        if (step !== 2 || isTransitioning) {
            console.warn("Premature submission blocked. Step:", step, "Transitioning:", isTransitioning);
            return;
        }

        // Prevent empty module submission
        if (!data.items || data.items.length === 0) {
            console.warn("Attempted to submit empty module");
            toast({
                title: t('creation.incompleteContent'),
                description: t('validation.atLeastOneItem'),
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const url = isEditMode ? `/api/modules/${editId}` : "/api/modules";
            const method = isEditMode ? "PATCH" : "POST";

            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: data.title,
                    description: data.description,
                    type: data.type,
                    isForkable: data.isForkable,
                    status: 'ACTIVE',
                    items: data.items, // Ensure items are sent
                    category: data.category,
                    subCategory: data.subCategory
                })
            });

            if (!res.ok) throw new Error(t('validation.failedToSave'));

            const result = await res.json();
            toast({
                title: t('common.success'),
                description: isEditMode ? t('validation.moduleUpdated') : t('validation.moduleCreated'),
            });
            router.push(`/dashboard/library`); // Redirect to library after creation/update

        } catch (error) {
            console.error(error);
            toast({
                title: t('common.error'),
                description: t('common.error'),
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-12"
            >
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                    {isEditMode ? t('creation.editTitle') : t('creation.newTitle')}
                </h1>
                <p className="text-muted-foreground text-lg">
                    {isEditMode ? t('creation.editDescription') : t('creation.description')}
                </p>
            </motion.div>

            {/* Premium Step Indicator */}
            <div className="relative mb-12 px-4 sm:px-8">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                        initial={{ width: "0%" }}
                        animate={{ width: step === 1 ? "25%" : "100%" }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                </div>
                <div className="relative flex items-center justify-between">
                    {[1, 2].map((i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <motion.div
                                animate={{
                                    scale: step === i ? 1.2 : 1,
                                    backgroundColor: step >= i ? "var(--primary)" : "var(--muted)",
                                    borderColor: step >= i ? "var(--primary)" : "black"
                                }}
                                className={`h-10 w-10 rounded-full flex items-center justify-center border-2 z-10 text-white font-bold transition-all duration-300 shadow-xl`}
                            >
                                {step > i ? "✓" : i}
                            </motion.div>
                            <span className={`text-sm font-semibold ${step >= i ? "text-primary" : "text-muted-foreground"}`}>
                                {i === 1 ? t('creation.step1Label') : t('creation.step2Label')}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Card className="p-4 sm:p-6 md:p-8 min-h-[500px] md:min-h-[550px] shadow-2xl border-white/20 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl relative overflow-hidden group">
                        {/* Decorative background element */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors duration-700" />
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors duration-700" />

                        <div className="relative z-10 flex flex-col h-full">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex-1"
                                >
                                    {step === 1 && <BasicInfoStep isEditMode={isEditMode} />}
                                    {step === 2 && <ContentEditorStep />}
                                </motion.div>
                            </AnimatePresence>

                            <div className="flex justify-between mt-12 pt-6 border-t border-border/50">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={prevStep}
                                    disabled={step === 1}
                                    className="hover:bg-accent/50 transition-all duration-300"
                                >
                                    <ChevronLeft className="mr-2 h-4 w-4" /> {t('common.back')}
                                </Button>

                                {step === 1 ? (
                                    <Button
                                        type="button"
                                        onClick={nextStep}
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 px-8 transition-all hover:scale-105 active:scale-95"
                                    >
                                        {t('creation.next')} <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting || isTransitioning}
                                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20 px-10 transition-all hover:scale-105 active:scale-95"
                                    >
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        {isEditMode ? t('common.save') : t('creation.save')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                </form>
            </FormProvider>
        </div>
    );
}
