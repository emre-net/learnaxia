
import { useFormContext, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Layers, Edit2 } from "lucide-react";
import { ModuleFormData } from "./manual-creation-wizard";
import { ItemEditorSheet } from "./item-editor-sheet";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useTranslation } from "@/lib/i18n/i18n";

import { motion, AnimatePresence } from "framer-motion";

export function ContentEditorStep() {
    const { t } = useTranslation();
    const { control, watch, getValues } = useFormContext<ModuleFormData>();
    const { fields, append, remove, update } = useFieldArray({
        control,
        name: "items"
    });

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
    const [editingItemData, setEditingItemData] = useState<any>(null);

    const type = watch("type");

    const handleAddItem = (item: any) => {
        if (editingItemIndex !== null) {
            update(editingItemIndex, item);
            setEditingItemIndex(null);
            setEditingItemData(null);
        } else {
            append(item);
        }
    };

    const handleEditClick = (index: number) => {
        const realItemData = getValues(`items.${index}`);
        setEditingItemIndex(index);
        setEditingItemData(realItemData);
        setIsSheetOpen(true);
    };

    const handleAddNewClick = () => {
        setEditingItemIndex(null);
        setEditingItemData(null);
        setIsSheetOpen(true);
    };

    const getAnswerDisplay = (field: any) => {
        const answer = field.content?.answer;
        if (!answer) return t('creation.noAnswer');

        if (field.type === 'MC') return `${t('creation.itemEditor.answerLabel')}: ${answer}`;
        if (field.type === 'TRUE_FALSE') return `${t('creation.itemEditor.answerLabel')}: ${answer === "True" ? t('creation.itemEditor.trueLabel') : t('creation.itemEditor.falseLabel')}`;
        if (field.type === 'FLASHCARD') return answer;
        return answer;
    };

    const getTypeLabel = (t_key: string) => {
        switch (t_key) {
            case 'FLASHCARD': return t('creation.itemFlashcard');
            case 'MC': return t('creation.itemMC');
            case 'GAP': return t('creation.itemGap');
            case 'TRUE_FALSE': return t('creation.itemTF');
            default: return t('creation.itemGeneric');
        }
    };

    return (
        <div className="h-full flex flex-col gap-6">
            <div className="flex justify-between items-center bg-muted/20 p-4 rounded-2xl border border-muted-foreground/10">
                <div>
                    <h3 className="text-xl font-bold tracking-tight">{t('creation.moduleContentTitle')}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('creation.totalItems', { count: fields.length })}</p>
                </div>
                <Button
                    type="button"
                    onClick={handleAddNewClick}
                    className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus className="mr-2 h-4 w-4" /> {t('creation.addItem')}
                </Button>
            </div>

            <ScrollArea className="flex-1 bg-muted/5 rounded-2xl border-2 border-dashed border-muted-foreground/20 p-6 min-h-[400px]">
                {fields.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center h-[350px] text-muted-foreground gap-4"
                    >
                        <div className="bg-muted p-6 rounded-full">
                            <Layers className="h-12 w-12 opacity-30" />
                        </div>
                        <div className="text-center">
                            <p className="font-medium text-lg">{t('creation.noItemsYet')}</p>
                            <Button type="button" variant="link" onClick={handleAddNewClick} className="text-primary font-bold mt-1">
                                {t('creation.addFirstItem', { type: getTypeLabel(type) })}
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {fields.map((field, index) => (
                                <motion.div
                                    key={field.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Card
                                        className="p-5 flex justify-between items-center group hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm border-white/20 dark:border-white/10"
                                        onClick={() => handleEditClick(index)}
                                    >
                                        <div className="flex gap-4 items-center overflow-hidden">
                                            <div className="bg-primary/10 text-primary h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 border border-primary/20">
                                                {index + 1}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                                    {field.content?.question}
                                                </p>
                                                <p className="text-xs text-muted-foreground line-clamp-1 italic mt-0.5">
                                                    {getAnswerDisplay(field)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditClick(index);
                                                }}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all rounded-xl"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    remove(index);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </ScrollArea>

            <ItemEditorSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                onSave={handleAddItem}
                type={type as any}
                initialData={editingItemData}
            />
        </div>
    );
}
