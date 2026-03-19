import { auth } from "@/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const libraryEntries = await prisma.userJourneyLibrary.findMany({
            where: {
                userId: session.user.id
            },
            include: {
                journey: {
                    select: {
                        id: true,
                        title: true,
                        topic: true,
                        status: true,
                        createdAt: true,
                        _count: {
                            select: { slides: true }
                        }
                    }
                }
            },
            orderBy: {
                lastInteractionAt: 'desc'
            }
        });

        const journeys = libraryEntries.map(entry => entry.journey);

        return NextResponse.json(journeys);
    } catch (error) {
        console.error("Library Journeys API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
