
import { useFormContext, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Layers } from "lucide-react";
import { ModuleFormData } from "./manual-creation-wizard";
import { ItemEditorSheet } from "./item-editor-sheet";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ContentEditorStep() {
    const { control, watch } = useFormContext<ModuleFormData>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    });

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const type = watch("type"); // FLASHCARD, MC, GAP, TRUE_FALSE

    const handleAddItem = (item: any) => {
        append(item);
    };

    const getAnswerDisplay = (field: any) => {
        if (field.type === 'MC') return `Cevap: ${field.content?.answer}`;
        if (field.type === 'TRUE_FALSE') return `Cevap: ${field.content?.answer === "True" ? "Doğru" : "Yanlış"}`;
        if (field.type === 'FLASHCARD') return field.content?.answer;
        return field.content?.answer;
    };

    const getTypeLabel = (t: string) => {
        switch (t) {
            case 'FLASHCARD': return 'kart';
            case 'MC': return 'soru';
            case 'GAP': return 'boşluk doldurma';
            case 'TRUE_FALSE': return 'D/Y sorusu';
            default: return 'içerik';
        }
    };

    return (
        <div className="h-full flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Modül İçeriği</h3>
                <Button onClick={() => setIsSheetOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> İçerik Ekle
                </Button>
            </div>

            <ScrollArea className="flex-1 border rounded-md p-4 h-[400px]">
                {fields.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                        <Layers className="h-10 w-10 opacity-20" />
                        <p>Henüz içerik eklenmedi.</p>
                        <Button variant="link" onClick={() => setIsSheetOpen(true)}>
                            İlk {getTypeLabel(type)} içeriğini ekle
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <Card key={field.id} className="p-4 flex justify-between items-start group hover:border-primary transition-colors">
                                <div className="flex gap-3">
                                    <div className="bg-muted h-6 w-6 rounded-full flex items-center justify-center text-xs font-mono mt-1 shrink-0">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium line-clamp-1">{field.content?.question}</p>
                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                            {getAnswerDisplay(field)}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </Card>
                        ))}
                    </div>
                )}
            </ScrollArea>

            <div className="text-sm text-muted-foreground text-right">
                Toplam İçerik: {fields.length}
            </div>

            <ItemEditorSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                onSave={handleAddItem}
                type={type as any} // Cast safely as we know type matches
            />
        </div>
    );
}
