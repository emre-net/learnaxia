

import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ModuleFormData } from "./manual-creation-wizard";
import { useState, useEffect } from "react";
import { BookOpen, CheckSquare, FileText, CheckCircle2 } from "lucide-react";

// Categories Data
const CATEGORIES: Record<string, string[]> = {
    "Diller": ["İngilizce", "Almanca", "İspanyolca", "Fransızca", "Diğer"],
    "Sınavlar (YKS/LGS/KPSS)": ["TYT", "AYT", "LGS", "KPSS", "ALES", "YDS"],
    "Tıp & Sağlık": ["Anatomi", "Farmakoloji", "Klinik Bilimler", "Dahiliye", "Diğer"],
    "Matematik & Fen": ["Matematik", "Fizik", "Kimya", "Biyoloji"],
    "Yazılım & Teknoloji": ["Siber Güvenlik", "Yazılım Geliştirme", "Veri Bilimi", "Yapay Zeka", "Ağ Sistemleri"],
    "Tarih & Coğrafya": ["Tarih", "Coğrafya", "Felsefe", "Din Kültürü"],
    "Ehliyet": ["Trafik", "Motor", "İlk Yardım"],
    "Genel Kültür": ["Sanat", "Edebiyat", "Sinema", "Müzik", "Spor"],
    "Diğer": ["Kişisel Gelişim", "Hobi", "Diğer"]
};

export function BasicInfoStep() {
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
                        <FormLabel>Modül Başlığı</FormLabel>
                        <FormControl>
                            <Input placeholder="Örn: İspanyolca Kelimeler A1" {...field} />
                        </FormControl>
                        <FormDescription>
                            Modülünüz için açıklayıcı bir isim girin.
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
                        <FormLabel>Açıklama</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="Bu modülde ne öğreneceksiniz?"
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
                            <FormLabel>Kategori</FormLabel>
                            <Select onValueChange={(val) => {
                                field.onChange(val);
                                setValue("subCategory", ""); // Reset sub on change
                            }} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Kategori Seçin" />
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
                            <FormLabel>Alt Kategori</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedCategory}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={selectedCategory ? "Alt Kategori Seçin" : "Önce Kategori Seçin"} />
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

            {/* Type */}
            <FormField
                control={control}
                name="type"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel>İçerik Tipi</FormLabel>
                        <FormControl>
                            <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                            >
                                <FormItem>
                                    <FormControl>
                                        <RadioGroupItem value="FLASHCARD" className="peer sr-only" />
                                    </FormControl>
                                    <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full">
                                        <BookOpen className="mb-2 h-6 w-6" />
                                        <span className="font-semibold">Kartlar</span>
                                        <span className="text-xs text-muted-foreground text-center mt-1">Ön/Arka kartlar. Ezber için ideal.</span>
                                    </FormLabel>
                                </FormItem>

                                <FormItem>
                                    <FormControl>
                                        <RadioGroupItem value="MC" className="peer sr-only" />
                                    </FormControl>
                                    <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full">
                                        <CheckSquare className="mb-2 h-6 w-6" />
                                        <span className="font-semibold">Çoktan Seçmeli</span>
                                        <span className="text-xs text-muted-foreground text-center mt-1">Test usulü sorular.</span>
                                    </FormLabel>
                                </FormItem>

                                <FormItem>
                                    <FormControl>
                                        <RadioGroupItem value="GAP" className="peer sr-only" />
                                    </FormControl>
                                    <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full">
                                        <FileText className="mb-2 h-6 w-6" />
                                        <span className="font-semibold">Boşluk Doldurma</span>
                                        <span className="text-xs text-muted-foreground text-center mt-1">Dil bilgisi için ideal.</span>
                                    </FormLabel>
                                </FormItem>

                                <FormItem>
                                    <FormControl>
                                        <RadioGroupItem value="TRUE_FALSE" className="peer sr-only" />
                                    </FormControl>
                                    <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full">
                                        <CheckCircle2 className="mb-2 h-6 w-6" />
                                        <span className="font-semibold">Doğru / Yanlış</span>
                                        <span className="text-xs text-muted-foreground text-center mt-1">Hızlı tekrar soruları.</span>
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
