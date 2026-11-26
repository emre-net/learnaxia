import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMobileUser } from "@/lib/auth/mobile-jwt";
import prisma from "@/lib/prisma";
import { NoteService } from "@/domains/note/note.service";

async function resolveUserId(req: NextRequest): Promise<string | null> {
    const mobileUser = await getMobileUser(req);
    if (mobileUser?.id) return mobileUser.id;
    const session = await auth();
    return session?.user?.id || null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const userId = await resolveUserId(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const solved = await prisma.solvedQuestion.findUnique({ where: { id } });
        if (!solved || solved.userId !== userId) {
            return NextResponse.json({ error: "Kayıt bulunamadı veya yetkisiz" }, { status: 404 });
        }

        const body = await req.json();
        const noteText = typeof body.note === "string" ? body.note.trim() : "";
        const noteTitle = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "AI Çözüm Notu";

        if (!noteText) {
            return NextResponse.json({ error: "Not içeriği boş olamaz" }, { status: 400 });
        }

        const createdNote = await NoteService.create(userId, {
            title: noteTitle,
            content: noteText,
            solvedQuestionId: solved.id,
        });

        return NextResponse.json({ success: true, note: createdNote });
    } catch (error) {
        console.error("[SOLVED_QUESTION_PATCH]", error);
        return NextResponse.json({ error: "Not kaydedilemedi" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const userId = await resolveUserId(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const solved = await prisma.solvedQuestion.findUnique({ where: { id } });
        if (!solved || solved.userId !== userId) {
            return NextResponse.json({ error: "Kayıt bulunamadı veya yetkisiz" }, { status: 404 });
        }

        await prisma.solvedQuestion.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[SOLVED_QUESTION_DELETE]", error);
        return NextResponse.json({ error: "Çözüm silinemedi" }, { status: 500 });
    }
}
