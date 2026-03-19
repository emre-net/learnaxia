
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ModuleFormData } from "./manual-creation-wizard";
import { useState, useEffect } from "react";
import { GalleryVerticalEnd, ListTodo, Braces, Split } from "lucide-react";

import { CATEGORIES } from "@/lib/constants/categories";

import { useTranslation } from "@/lib/i18n/i18n";

import { motion } from "framer-motion";

export function BasicInfoStep({ isEditMode }: { isEditMode?: boolean }) {
    const { t } = useTranslation();
    const { control, watch, setValue } = useFormContext<ModuleFormData>();
    const selectedCategory = watch("category");
    const selectedType = watch("type");
    const isPublic = watch("isForkable");

    const contentTypes = [
        { id: "FLASHCARD", icon: GalleryVerticalEnd, label: t('creation.flashcardsLabel'), desc: t('creation.flashcardsDescription'), color: "blue" },
        { id: "MC", icon: ListTodo, label: t('creation.mcLabel'), desc: t('creation.mcDescription'), color: "indigo" },
        { id: "GAP", icon: Braces, label: t('creation.gapLabel'), desc: t('creation.gapDescription'), color: "purple" },
        { id: "TRUE_FALSE", icon: Split, label: t('creation.tfLabel'), desc: t('creation.tfDescription'), color: "pink" },
    ];

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6">
                <FormField
                    control={control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm font-bold text-foreground/70 uppercase tracking-wider flex items-center gap-1">
                                {t('creation.moduleTitleLabel')} <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder={t('creation.moduleTitlePlaceholder')}
                                    className="h-12 bg-muted/30 border-muted-foreground/20 focus:border-primary/50 transition-all text-lg font-medium"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription className="text-xs">
                                {t('creation.titleDescription')}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm font-bold text-foreground/70 uppercase tracking-wider">
                                {t('creation.descriptionLabelOptional')}
                            </FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder={t('creation.descriptionPlaceholder')}
                                    className="resize-none h-28 bg-muted/30 border-muted-foreground/20 focus:border-primary/50 transition-all"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm font-bold text-foreground/70 uppercase tracking-wider flex items-center gap-1">
                                {t('creation.categoryLabel')} {isPublic ? <span className="text-destructive">*</span> : <span className="text-[10px] lowercase font-normal opacity-50">({t('common.optional') || 'optional'})</span>}
                            </FormLabel>
                            <Select onValueChange={(val) => {
                                field.onChange(val);
                                setValue("subCategory", "");
                            }} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="h-11 bg-muted/30 border-muted-foreground/20 ring-offset-background focus:ring-2 focus:ring-primary/20 transition-all">
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
                    control={control}
                    name="subCategory"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm font-bold text-foreground/70 uppercase tracking-wider flex items-center gap-1">
                                {t('creation.subCategoryLabel')} {isPublic ? <span className="text-destructive">*</span> : <span className="text-[10px] lowercase font-normal opacity-50">({t('common.optional') || 'optional'})</span>}
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCategory}>
                                <FormControl>
                                    <SelectTrigger className="h-11 bg-muted/30 border-muted-foreground/20 ring-offset-background focus:ring-2 focus:ring-primary/20 transition-all">
                                        <SelectValue placeholder={selectedCategory ? t('creation.subCategoryPlaceholder') : t('creation.firstSelectCategory')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {selectedCategory && CATEGORIES[selectedCategory]?.map((sub) => (
                                        <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="space-y-4">
                <FormLabel className="text-sm font-bold text-foreground/80 flex items-center gap-2 uppercase tracking-wider">
                    {t('creation.contentTypeLabel')}
                </FormLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {contentTypes.map((type) => {
                        const Icon = type.icon;
                        const isSelected = selectedType === type.id;

                        return (
                            <motion.div
                                key={type.id}
                                whileHover={!isEditMode ? { y: -5, scale: 1.02 } : {}}
                                whileTap={!isEditMode ? { scale: 0.98 } : {}}
                                className="h-full"
                                onClick={() => !isEditMode && setValue("type", type.id as any)}
                            >
                                <div className={`
                                    relative h-full p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center text-center gap-3 cursor-pointer overflow-hidden group
                                    ${isSelected
                                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                                        : "border-muted-foreground/10 bg-muted/20 hover:border-muted-foreground/30"}
                                    ${isEditMode && !isSelected ? "opacity-40 grayscale pointer-events-none" : ""}
                                `}>
                                    {/* Selection Glow */}
                                    {isSelected && (
                                        <motion.div
                                            layoutId="activeGlow"
                                            className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none"
                                        />
                                    )}

                                    <div className={`p-3 rounded-xl transition-colors duration-300 ${isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/10"}`}>
                                        <Icon className="h-6 w-6" />
                                    </div>

                                    <div>
                                        <h4 className={`font-bold transition-colors ${isSelected ? "text-primary" : "text-foreground"}`}>
                                            {type.label}
                                        </h4>
                                        <p className="text-[10px] leading-tight text-muted-foreground mt-1">
                                            {type.desc}
                                        </p>
                                    </div>

                                    {isSelected && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute top-2 right-2 h-5 w-5 bg-primary text-white rounded-full flex items-center justify-center text-[10px]"
                                        >
                                            ✓
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <FormField
                control={control}
                name="isForkable"
                render={({ field }) => (
                    <FormItem className="space-y-4 pt-4">
                        <FormLabel className="text-sm font-bold text-foreground/80 uppercase tracking-wider">{t('creation.visibilityLabel')}</FormLabel>
                        <FormControl>
                            <RadioGroup
                                onValueChange={(val) => field.onChange(val === "true")}
                                defaultValue={field.value ? "true" : "false"}
                                className="flex flex-col sm:flex-row gap-4"
                            >
                                <FormItem className={`flex-1 flex items-start space-x-3 space-y-0 p-4 rounded-xl border-2 transition-all cursor-pointer ${field.value ? "border-primary bg-primary/5" : "border-muted-foreground/10 hover:border-muted-foreground/20"}`} onClick={() => field.onChange(true)}>
                                    <FormControl>
                                        <RadioGroupItem value="true" className="mt-1" />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                        <span className="font-bold text-sm block">{t('creation.public')}</span>
                                        <span className="text-muted-foreground text-[10px] leading-tight block mt-0.5">{t('creation.publicDescription')}</span>
                                    </FormLabel>
                                </FormItem>
                                <FormItem className={`flex-1 flex items-start space-x-3 space-y-0 p-4 rounded-xl border-2 transition-all cursor-pointer ${!field.value ? "border-primary bg-primary/5" : "border-muted-foreground/10 hover:border-muted-foreground/20"}`} onClick={() => field.onChange(false)}>
                                    <FormControl>
                                        <RadioGroupItem value="false" className="mt-1" />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                        <span className="font-bold text-sm block">{t('creation.private')}</span>
                                        <span className="text-muted-foreground text-[10px] leading-tight block mt-0.5">{t('creation.privateDescription')}</span>
                                    </FormLabel>
                                </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}
