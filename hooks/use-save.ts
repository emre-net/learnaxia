
"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface UseSaveOptions {
    id: string;
    type: 'module' | 'collection';
    initialSaved?: boolean;
    initialSaveCount?: number;
    onSuccess?: (isSaved: boolean, newCount: number) => void;
}

export function useSave({ id, type, initialSaved = false, initialSaveCount = 0, onSuccess }: UseSaveOptions) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(initialSaved);
    const [saveCount, setSaveCount] = useState(initialSaveCount);

    const handleSave = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (isSaving) return;

        setIsSaving(true);
        try {
            const endpoint = type === 'module' ? `/api/modules/${id}/save` : `/api/collections/${id}/save`;
            const method = isSaved ? 'DELETE' : 'POST';

            const res = await fetch(endpoint, { method });

            if (res.ok) {
                const newSavedState = !isSaved;
                const newCount = newSavedState ? saveCount + 1 : Math.max(0, saveCount - 1);

                setIsSaved(newSavedState);
                setSaveCount(newCount);

                // Invalidate relevant queries
                const queryKey = type === 'module' ? 'library-modules' : 'library-collections';
                queryClient.invalidateQueries({ queryKey: [queryKey] });

                if (onSuccess) {
                    onSuccess(newSavedState, newCount);
                }

                toast({
                    title: "Başarılı",
                    description: newSavedState
                        ? `${type === 'module' ? 'Modül' : 'Koleksiyon'} kitaplığına kaydedildi.`
                        : `${type === 'module' ? 'Modül' : 'Koleksiyon'} kitaplığından kaldırıldı.`
                });
            } else {
                throw new Error("API hatası");
            }
        } catch (error) {
            toast({
                title: "Hata",
                description: "İşlem gerçekleştirilemedi.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    return {
        isSaved,
        saveCount,
        isSaving,
        handleSave
    };
}
