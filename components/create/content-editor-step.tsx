
import { useFormContext, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Layers, Edit2 } from "lucide-react";
import { ModuleFormData } from "./manual-creation-wizard";
import { ItemEditorSheet } from "./item-editor-sheet";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ContentEditorStep() {
    const { control, watch } = useFormContext<ModuleFormData>();
    const { fields, append, remove, update } = useFieldArray({
        control,
        name: "items"
    });

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
    const [editingItemData, setEditingItemData] = useState<any>(null);

    const type = watch("type"); // FLASHCARD, MC, GAP, TRUE_FALSE

    const handleAddItem = (item: any) => {
        if (editingItemIndex !== null) {
            // Update existing item
            update(editingItemIndex, item);
            setEditingItemIndex(null);
            setEditingItemData(null);
        } else {
            // Add new item
            append(item);
        }
    };

    const handleEditClick = (index: number, item: any) => {
        setEditingItemIndex(index);
        setEditingItemData(item);
        setIsSheetOpen(true);
    };

    const handleAddNewClick = () => {
        setEditingItemIndex(null);
        setEditingItemData(null);
        setIsSheetOpen(true);
    };

    const getAnswerDisplay = (field: any) => {
        const answer = field.content?.answer;
        if (!answer) return "Cevap yok";

        if (field.type === 'MC') return `Cevap: ${answer}`;
        if (field.type === 'TRUE_FALSE') return `Cevap: ${answer === "True" ? "Doğru" : "Yanlış"}`;
        if (field.type === 'FLASHCARD') return answer;
        return answer;
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
                <Button type="button" onClick={handleAddNewClick}>
                    <Plus className="mr-2 h-4 w-4" /> İçerik Ekle
                </Button>
            </div>

            <ScrollArea className="flex-1 border rounded-md p-4 h-[400px]">
                {fields.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                        <Layers className="h-10 w-10 opacity-20" />
                        <p>Henüz içerik eklenmedi.</p>
                        <Button type="button" variant="link" onClick={handleAddNewClick}>
                            İlk {getTypeLabel(type)} içeriğini ekle
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <Card
                                key={field.id}
                                className="p-4 flex justify-between items-start group hover:border-primary transition-colors cursor-pointer"
                                onClick={() => handleEditClick(index, field)}
                            >
                                <div className="flex gap-3 pointer-events-none">
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
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditClick(index, field);
                                        }}
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            remove(index);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
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
                type={type as any}
                initialData={editingItemData} // Pass initial data for editing
            />
        </div>
    );
}
