
import { useFormContext, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Edit2, Layers } from "lucide-react";
import { ModuleFormData } from "./manual-creation-wizard";
import { ItemEditorSheet } from "./item-editor-sheet";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export function ContentEditorStep() {
    const { control, watch } = useFormContext<ModuleFormData>();
    const { fields, append, remove, update } = useFieldArray({
        control,
        name: "items"
    });

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const type = watch("type"); // FLASHCARD, MC, GAP

    const handleAddItem = (item: any) => {
        append(item);
    };

    return (
        <div className="h-full flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Module Content</h3>
                <Button onClick={() => setIsSheetOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                </Button>
            </div>

            <ScrollArea className="flex-1 border rounded-md p-4 h-[400px]">
                {fields.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                        <Layers className="h-10 w-10 opacity-20" />
                        <p>No items added yet.</p>
                        <Button variant="link" onClick={() => setIsSheetOpen(true)}>Add your first {type.toLowerCase()}</Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <Card key={field.id} className="p-4 flex justify-between items-start group">
                                <div className="flex gap-3">
                                    <div className="bg-muted h-6 w-6 rounded-full flex items-center justify-center text-xs font-mono mt-1">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium line-clamp-1">{field.content?.question}</p>
                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                            {field.type === 'MC' ? `Answer: ${field.content?.answer}` : field.content?.answer}
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
                Total Items: {fields.length}
            </div>

            <ItemEditorSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                onSave={handleAddItem}
                type={type}
            />
        </div>
    );
}
