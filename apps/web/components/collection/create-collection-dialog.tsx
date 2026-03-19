
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Assuming I fixed it manually
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/constants/categories";
import { useTranslation } from "@/lib/i18n/i18n";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const getCollectionSchema = (t: any) => z.object({
    title: z.string().min(3, t('validation.titleMin')).max(100, t('validation.titleMax')),
    description: z.string().max(500, t('validation.descriptionMax')).optional(),
    visibility: z.enum(["PUBLIC", "PRIVATE"]),
    category: z.string().optional(),
    subCategory: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.visibility === 'PUBLIC') {
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

type CollectionFormValues = {
    title: string;
    description?: string;
    visibility: "PUBLIC" | "PRIVATE";
    category?: string;
    subCategory?: string;
};

export function CreateCollectionDialog({ children }: { children?: React.ReactNode }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const collectionSchema = getCollectionSchema(t);

    const form = useForm<CollectionFormValues>({
        resolver: zodResolver(collectionSchema),
        defaultValues: {
            title: "",
            description: "",
            visibility: "PRIVATE",
            category: "",
            subCategory: ""
        },
    });

    const isPublic = form.watch("visibility") === "PUBLIC";
    const selectedCategory = form.watch("category");

    async function onSubmit(values: CollectionFormValues) {
        try {
            const res = await fetch("/api/collections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            if (!res.ok) throw new Error("Failed to create collection");

            toast({
                title: t('common.success'),
                description: t('validation.moduleCreated'), // Reusing similar message
            });

            setOpen(false);
            form.reset();
            queryClient.invalidateQueries({ queryKey: ['library-collections'] });
        } catch (error) {
            console.error(error);
            toast({
                title: t('common.error'),
                description: t('common.error'),
                variant: "destructive"
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-105 active:scale-95 transition-all text-white">
                        <Plus className="mr-2 h-4 w-4" /> {t('library.tabs.collections')}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-white/20 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        {t('creation.collection.newTitle')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('creation.collection.description')}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-foreground/70 flex items-center gap-1">
                                        {t('creation.moduleTitleLabel')} <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('creation.moduleTitlePlaceholder')} className="h-11 bg-muted/30" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                                        {t('creation.descriptionLabelOptional')}
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t('creation.descriptionPlaceholder')}
                                            className="resize-none h-20 bg-muted/30"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="visibility"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                                        {t('creation.visibilityLabel')}
                                    </FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            className="grid grid-cols-2 gap-3"
                                        >
                                            <FormItem className={`flex items-start space-x-3 space-y-0 p-3 rounded-xl border-2 transition-all cursor-pointer ${field.value === "PUBLIC" ? "border-primary bg-primary/5 shadow-sm" : "border-muted-foreground/10 hover:border-muted-foreground/20"}`} onClick={() => field.onChange("PUBLIC")}>
                                                <FormControl>
                                                    <RadioGroupItem value="PUBLIC" className="mt-1" />
                                                </FormControl>
                                                <FormLabel className="font-normal cursor-pointer">
                                                    <span className="font-bold text-xs block">{t('creation.public')}</span>
                                                    <span className="text-muted-foreground text-[9px] leading-tight block mt-0.5">{t('creation.collection.publicDescription')}</span>
                                                </FormLabel>
                                            </FormItem>
                                            <FormItem className={`flex items-start space-x-3 space-y-0 p-3 rounded-xl border-2 transition-all cursor-pointer ${field.value === "PRIVATE" ? "border-primary bg-primary/5 shadow-sm" : "border-muted-foreground/10 hover:border-muted-foreground/20"}`} onClick={() => field.onChange("PRIVATE")}>
                                                <FormControl>
                                                    <RadioGroupItem value="PRIVATE" className="mt-1" />
                                                </FormControl>
                                                <FormLabel className="font-normal cursor-pointer">
                                                    <span className="font-bold text-xs block">{t('creation.private')}</span>
                                                    <span className="text-muted-foreground text-[9px] leading-tight block mt-0.5">{t('creation.collection.privateDescription')}</span>
                                                </FormLabel>
                                            </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-foreground/70 flex items-center gap-1">
                                            {t('creation.categoryLabel')} {isPublic && <span className="text-destructive">*</span>}
                                        </FormLabel>
                                        <Select onValueChange={(val) => {
                                            field.onChange(val);
                                            form.setValue("subCategory", "");
                                        }} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-muted/30">
                                                    <SelectValue placeholder={t('creation.categoryPlaceholder')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.keys(CATEGORIES).map((cat) => (
                                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="subCategory"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-foreground/70 flex items-center gap-1">
                                            {t('creation.subCategoryLabel')} {isPublic && <span className="text-destructive">*</span>}
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCategory}>
                                            <FormControl>
                                                <SelectTrigger className="bg-muted/30">
                                                    <SelectValue placeholder={selectedCategory ? t('creation.subCategoryPlaceholder') : t('creation.firstSelectCategory')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {selectedCategory && (CATEGORIES as Record<string, string[]>)[selectedCategory]?.map((sub) => (
                                                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 rounded-xl h-11 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                {t('common.save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
