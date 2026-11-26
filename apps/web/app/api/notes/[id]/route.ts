import { auth } from "@/auth";
import { getMobileUser } from "@/lib/auth/mobile-jwt";
import { NoteService } from "@/domains/note/note.service";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateNoteSchema = z.object({
    title: z.string().optional(),
    content: z.string().min(1, "Not içeriği boş olamaz").optional(),
    visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
});

async function resolveUserId(req: Request): Promise<string | null> {
    const mobileUser = await getMobileUser(req);
    if (mobileUser?.id) return mobileUser.id;
    const session = await auth();
    return session?.user?.id || null;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const userId = await resolveUserId(req);
        const { id } = await params;

        const note = await prisma.note.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, handle: true, image: true } },
                module: { select: { id: true, title: true } }
            }
        });

        if (!note) {
            return NextResponse.json({ error: "Not bulunamadı" }, { status: 404 });
        }

        const isOwner = Boolean(userId && note.userId === userId);
        if (note.visibility !== "PUBLIC" && !isOwner) {
            return NextResponse.json({ error: userId ? "Bu notu görüntüleme yetkiniz yok" : "Unauthorized" }, { status: userId ? 403 : 401 });
        }

        return NextResponse.json({
            ...note,
            owner: note.user,
            isOwner,
        });
    } catch (error) {
        console.error("Failed to fetch note:", error);
        return NextResponse.json({ error: "Not yüklenemedi" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const userId = await resolveUserId(req);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const validated = updateNoteSchema.parse(body);

        const updatedNote = await NoteService.update(userId, id, validated);
        return NextResponse.json(updatedNote);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 });
        }
        const msg = String(error?.message || "");
        if (msg.toLowerCase().includes("not found")) {
            return NextResponse.json({ error: "Not bulunamadı" }, { status: 404 });
        }
        if (msg.toLowerCase().includes("denied") || msg.toLowerCase().includes("unauthorized")) {
            return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 403 });
        }
        console.error("Failed to update note:", error);
        return NextResponse.json({ error: "Not güncellenemedi" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const userId = await resolveUserId(req);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        await NoteService.delete(userId, id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        const msg = String(error?.message || "");
        if (msg.toLowerCase().includes("not found")) {
            return NextResponse.json({ error: "Not bulunamadı" }, { status: 404 });
        }
        if (msg.toLowerCase().includes("denied") || msg.toLowerCase().includes("unauthorized")) {
            return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 403 });
        }
        console.error("Failed to delete note:", error);
        return NextResponse.json({ error: "Not silinemedi" }, { status: 500 });
    }
}
