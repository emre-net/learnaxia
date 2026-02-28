import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { logger } from "@/lib/logger";
type Note = {
    id: string;
    moduleId?: string;
    itemId?: string;
    title?: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    module?: { title: string };
};

type CreateNoteDto = {
    moduleId?: string;
    itemId?: string;
    title?: string;
    content: string;
};

type UpdateNoteDto = {
    id: string;
    title?: string;
    content?: string;
};

async function fetchNotes(filters?: { moduleId?: string; itemId?: string }) {
    const params = new URLSearchParams();
    if (filters?.moduleId) params.append("moduleId", filters.moduleId);
    if (filters?.itemId) params.append("itemId", filters.itemId);

    const res = await fetch(`/api/notes?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch notes");
    return res.json();
}

async function createNote(data: CreateNoteDto) {
    const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create note");
    return res.json();
}

async function updateNote(data: UpdateNoteDto) {
    const res = await fetch(`/api/notes/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: data.title, content: data.content }),
    });
    if (!res.ok) throw new Error("Failed to update note");
    return res.json();
}

async function deleteNote(id: string) {
    const res = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete note");
    return res.json();
}

export function useNotes(filters?: { moduleId?: string; itemId?: string }) {
    const queryClient = useQueryClient();

    const query = useQuery<Note[]>({
        queryKey: ["notes", filters?.moduleId, filters?.itemId],
        queryFn: () => fetchNotes(filters),
    });

    const createMutation = useMutation({
        mutationFn: createNote,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notes"] });
        },
        onError: (err) => {
            logger.error("Failed to create note", {
                context: "useNotes",
                metadata: { error: err.message, filters }
            });
        }
    });

    const updateMutation = useMutation({
        mutationFn: updateNote,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notes"] });
        },
        onError: (err) => {
            logger.error("Failed to update note", {
                context: "useNotes",
                metadata: { error: err.message }
            });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteNote,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notes"] });
        },
        onError: (err) => {
            logger.error("Failed to delete note", {
                context: "useNotes",
                metadata: { error: err.message }
            });
        }
    });

    return {
        notes: query.data,
        isLoading: query.isLoading,
        error: query.error,
        createNote: createMutation.mutate,
        updateNote: updateMutation.mutate,
        deleteNote: deleteMutation.mutate,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
