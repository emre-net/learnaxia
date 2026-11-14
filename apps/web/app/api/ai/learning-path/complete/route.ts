import { auth } from "@/auth";
import { getMobileUser } from "@/lib/auth/mobile-jwt";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
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

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { journeyId } = body;

        // Verify ownership
        const userLibrary = await prisma.userJourneyLibrary.findFirst({
            where: {
                userId,
                journeyId: journeyId,
            }
        });

        if (!userLibrary) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Mark journey as active (ready)
        await prisma.learningJourney.update({
            where: { id: journeyId },
            data: { status: "ACTIVE" }
        });

        return NextResponse.json({ success: true, message: "Journey marked as active" });

    } catch (error: any) {
        console.error("Complete Journey API Error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
