import prisma from "@/lib/prisma";

export type CreateNoteDto = {
    moduleId?: string;
    itemId?: string;
    solvedQuestionId?: string;
    title?: string;
    content: string;
};

export type UpdateNoteDto = {
    title?: string;
    content?: string;
};

export class NoteService {
    /**
     * Create a new note. 
     * Verifies user access to the module if moduleId is provided.
     */
    static async create(userId: string, dto: CreateNoteDto) {
        // If linked to a module, verify access
        if (dto.moduleId) {
            const access = await prisma.userContentAccess.findFirst({
                where: {
                    userId: userId,
                    resourceId: dto.moduleId,
                }
            });

            if (!access) {
                const module = await prisma.module.findUnique({
                    where: { id: dto.moduleId },
                    select: { isForkable: true, ownerId: true }
                });

                if (!module) throw new Error("Module not found");

                if (!module.isForkable && module.ownerId !== userId) {
                    throw new Error("Access Denied: Cannot take notes on a private module you do not own.");
                }
            }
        }

        return await prisma.note.create({
            data: {
                userId,
                moduleId: dto.moduleId,
                itemId: dto.itemId,
                solvedQuestionId: dto.solvedQuestionId,
                title: dto.title,
                content: dto.content,
            }
        });
    }

    /**
     * Get all notes for a user, optionally filtered by module or item.
     */
    static async findAll(userId: string, filter?: { moduleId?: string; itemId?: string; solvedQuestionId?: string }) {
        return await prisma.note.findMany({
            where: {
                userId,
                ...(filter?.moduleId && { moduleId: filter.moduleId }),
                ...(filter?.itemId && { itemId: filter.itemId }),
                ...(filter?.solvedQuestionId && { solvedQuestionId: filter.solvedQuestionId }),
            },
            orderBy: { updatedAt: 'desc' },
            include: {
                module: {
                    select: { title: true }
                },
                item: {
                    select: { id: true, type: true }
                },
                solvedQuestion: {
                    select: { questionText: true }
                }
            }
        });
    }

    /**
     * Get a single note by ID.
     */
    static async findOne(userId: string, noteId: string) {
        const note = await prisma.note.findUnique({
            where: { id: noteId },
            include: {
                module: { select: { title: true } },
                solvedQuestion: { select: { questionText: true } }
            }
        });

        if (!note || note.userId !== userId) {
            return null;
        }

        return note;
    }

    /**
     * Update a note.
     */
    static async update(userId: string, noteId: string, dto: UpdateNoteDto) {
        const note = await prisma.note.findUnique({ where: { id: noteId } });

        if (!note || note.userId !== userId) {
            throw new Error("Note not found or access denied");
        }

        return await prisma.note.update({
            where: { id: noteId },
            data: {
                ...(dto.title !== undefined && { title: dto.title }),
                ...(dto.content !== undefined && { content: dto.content }),
            }
        });
    }

    /**
     * Delete a note.
     */
    static async delete(userId: string, noteId: string) {
        const note = await prisma.note.findUnique({ where: { id: noteId } });

        if (!note || note.userId !== userId) {
            throw new Error("Note not found or access denied");
        }

        return await prisma.note.delete({
            where: { id: noteId }
        });
    }
}
