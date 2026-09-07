export const dynamic = 'force-dynamic';

import { auth } from "@/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request, props: { params: Promise<{ journeyId: string }> }) {
    try {
        const params = await props.params;
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const journeyId = params.journeyId;
        const userId = session.user.id;

        // Verify access
        const isOwner = await prisma.userJourneyLibrary.findFirst({
            where: { userId, journeyId }
        });

        if (!isOwner) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const journey = await prisma.learningJourney.findUnique({
            where: { id: journeyId },
            include: {
                slides: { orderBy: { order: "asc" } }
            }
        });

        if (!journey) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json({
            status: journey.status,
            totalSlidesExpected: (journey.syllabus as any[])?.length || 0,
            generatedSlidesCount: journey.slides.length,
            journey: journey // Send updated journey with its current slides
        });

    } catch (error) {
        console.error("Journey Status API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
