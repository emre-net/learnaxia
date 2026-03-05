import { auth } from "@/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { journeyId } = body;

        // Verify ownership
        const userLibrary = await (prisma as any).userJourneyLibrary.findFirst({
            where: {
                userId: session.user.id,
                journeyId: journeyId,
            }
        });

        if (!userLibrary) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Mark journey as active (ready)
        await (prisma as any).learningJourney.update({
            where: { id: journeyId },
            data: { status: "ACTIVE" }
        });

        return NextResponse.json({ success: true, message: "Journey marked as active" });

    } catch (error: any) {
        console.error("Complete Journey API Error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
