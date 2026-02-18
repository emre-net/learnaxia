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
    const [isTransitioning, setIsTransitioning] = useState(false); // CRITICAL FIX: Prevent double-click submission
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("edit");
    const isEditMode = !!editId;

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
                    if (!res.ok) throw new Error("Module not found");
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
                    // toast.error("Modül yüklenemedi");
                }
            };
            fetchModule();
        }
    }, [editId, isEditMode, reset]);

    const nextStep = async () => {
        const isStepValid = await trigger(["title", "type", "isForkable"]); // Only trigger required fields for step 1
        console.log("Step 1 Valid:", isStepValid); // Debugging
        if (isStepValid) {
            setIsTransitioning(true); // Lock submission
            setStep(2);
            // Unlock after 500ms to prevent ghost clicks
            setTimeout(() => setIsTransitioning(false), 500);
        }
    };

    const prevStep = () => setStep(1);

    const onSubmit = async (data: ModuleFormData) => {
        console.log("Submit triggered. Current Step:", step, "Transitioning:", isTransitioning); // DEBUG

        // CRITICAL FIX: Prevent premature submission
        if (step !== 2 || isTransitioning) {
            console.warn("Premature submission blocked. Step:", step, "Transitioning:", isTransitioning);
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

            if (!res.ok) throw new Error("İşlem başarısız");

            const result = await res.json();
            router.push(`/dashboard/library`); // Redirect to library after creation/update

        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                {isEditMode ? "Modülü Düzenle" : "Yeni Modül Oluştur"}
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
                                <Button type="submit" disabled={isSubmitting || isTransitioning}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    {isEditMode ? "Değişiklikleri Kaydet" : "Modülü Oluştur"}
                                </Button>
                            )}
                        </div>
                    </Card>
                </form>
            </FormProvider>
        </div>
    );
}
