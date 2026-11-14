export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMobileUser } from "@/lib/auth/mobile-jwt";
import prisma from "@/lib/prisma";
import { NoteService } from "@/domains/note/note.service";

/**
 * Handle solved questions history and saving
 */
export async function GET(req: NextRequest) {
    try {
        let userId: string | undefined;
        const mobileUser = await getMobileUser(req);
        if (mobileUser?.id) {
            userId = mobileUser.id;
        } else {
            const session = await auth();
            if (session?.user?.id) {
                userId = session.user.id;
            }
        }

        if (!userId) return new NextResponse("Unauthorized", { status: 401 });

        const history = await prisma.solvedQuestion.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: {
                notes: true
            }
        });

        return NextResponse.json(history);
    } catch (error) {
        console.error("GET Solved Questions Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        let userId: string | undefined;
        const mobileUser = await getMobileUser(req);
        if (mobileUser?.id) {
            userId = mobileUser.id;
        } else {
            const session = await auth();
            if (session?.user?.id) {
                userId = session.user.id;
            }
        }

        if (!userId) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const { questionText, solution, imageUrl, note } = body;

        if (!questionText || !solution) {
            return NextResponse.json({ error: "Eksik veriler mevcut." }, { status: 400 });
        }

        // 1. Save the solved question
        const savedQuestion = await prisma.solvedQuestion.create({
            data: {
                userId,
                questionText,
                solution,
                imageUrl: imageUrl || "",
            }
        });

        // 2. If a note is provided, save it using the NoteService
        if (note && note.trim()) {
            await NoteService.create(userId, {
                content: note,
                solvedQuestionId: savedQuestion.id,
                title: "AI Çözüm Notu"
            });
        }

        return NextResponse.json(savedQuestion);

    } catch (error) {
        console.error("POST Solved Questions Error:", error);
        return NextResponse.json({ error: "Kaydedilirken bir hata oluştu." }, { status: 500 });
    }
}
