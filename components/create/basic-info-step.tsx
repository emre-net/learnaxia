
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

export function BasicInfoStep({ isEditMode }: { isEditMode?: boolean }) {
    const { t } = useTranslation();
    const { control, watch, setValue } = useFormContext<ModuleFormData>();
    const selectedCategory = watch("category");

    // Reset subCategory when category changes
    useEffect(() => {
        // This effect might be too aggressive if not handled carefully, 
        // but react-hook-form handles value updates. 
        // We'll rely on the user picking a new subcategory if they change category.
    }, [selectedCategory]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Title */}
            <FormField
                control={control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('creation.moduleTitleLabel')}</FormLabel>
                        <FormControl>
                            <Input placeholder={t('creation.moduleTitlePlaceholder')} {...field} />
                        </FormControl>
                        <FormDescription>
                            {t('creation.titleDescription')}
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Description */}
            <FormField
                control={control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('creation.descriptionLabelOptional')}</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder={t('creation.descriptionPlaceholder')}
                                className="resize-none h-24"
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Category selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('creation.categoryLabel')}</FormLabel>
                            <Select onValueChange={(val) => {
                                field.onChange(val);
                                setValue("subCategory", ""); // Reset sub on change
                            }} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
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
                            <FormLabel>{t('creation.subCategoryLabel')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCategory}>
                                <FormControl>
                                    <SelectTrigger>
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

            {/* Visibility (Public/Private) */}
            <FormField
                control={control}
                name="isForkable"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel>{t('creation.visibilityLabel')}</FormLabel>
                        <FormControl>
                            <RadioGroup
                                onValueChange={(val) => field.onChange(val === "true")}
                                defaultValue={field.value ? "true" : "false"}
                                className="flex flex-col space-y-1"
                            >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                        <RadioGroupItem value="true" />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                        <span className="font-semibold block">{t('creation.public')}</span>
                                        <span className="text-muted-foreground text-xs">{t('creation.publicDescription')}</span>
                                    </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                        <RadioGroupItem value="false" />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                        <span className="font-semibold block">{t('creation.private')}</span>
                                        <span className="text-muted-foreground text-xs">{t('creation.privateDescription')}</span>
                                    </FormLabel>
                                </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Type */}
            <FormField
                control={control}
                name="type"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel>{t('creation.contentTypeLabel')}</FormLabel>
                        <FormControl>
                            <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                disabled={isEditMode}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                            >
                                <FormItem>
                                    <FormControl>
                                        <RadioGroupItem value="FLASHCARD" className="peer sr-only" />
                                    </FormControl>
                                    <FormLabel className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full ${isEditMode ? "opacity-50 cursor-not-allowed" : ""}`}>
                                        <GalleryVerticalEnd className="mb-2 h-6 w-6" />
                                        <span className="font-semibold">{t('creation.flashcardsLabel')}</span>
                                        <span className="text-xs text-muted-foreground text-center mt-1">{t('creation.flashcardsDescription')}</span>
                                    </FormLabel>
                                </FormItem>

                                <FormItem>
                                    <FormControl>
                                        <RadioGroupItem value="MC" className="peer sr-only" />
                                    </FormControl>
                                    <FormLabel className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full ${isEditMode ? "opacity-50 cursor-not-allowed" : ""}`}>
                                        <ListTodo className="mb-2 h-6 w-6" />
                                        <span className="font-semibold">{t('creation.mcLabel')}</span>
                                        <span className="text-xs text-muted-foreground text-center mt-1">{t('creation.mcDescription')}</span>
                                    </FormLabel>
                                </FormItem>

                                <FormItem>
                                    <FormControl>
                                        <RadioGroupItem value="GAP" className="peer sr-only" />
                                    </FormControl>
                                    <FormLabel className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full ${isEditMode ? "opacity-50 cursor-not-allowed" : ""}`}>
                                        <Braces className="mb-2 h-6 w-6" />
                                        <span className="font-semibold">{t('creation.gapLabel')}</span>
                                        <span className="text-xs text-muted-foreground text-center mt-1">{t('creation.gapDescription')}</span>
                                    </FormLabel>
                                </FormItem>

                                <FormItem>
                                    <FormControl>
                                        <RadioGroupItem value="TRUE_FALSE" className="peer sr-only" />
                                    </FormControl>
                                    <FormLabel className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full ${isEditMode ? "opacity-50 cursor-not-allowed" : ""}`}>
                                        <Split className="mb-2 h-6 w-6" />
                                        <span className="font-semibold">{t('creation.tfLabel')}</span>
                                        <span className="text-xs text-muted-foreground text-center mt-1">{t('creation.tfDescription')}</span>
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
