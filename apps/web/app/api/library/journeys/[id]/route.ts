import { auth } from "@/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
    const params = await context.params;
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const journeyId = params.id;
        const userId = session.user.id;

        // Verify ownership
        const userLibrary = await prisma.userJourneyLibrary.findUnique({
            where: {
                userId_journeyId: {
                    userId,
                    journeyId
                }
            }
        });

        if (!userLibrary || userLibrary.role !== 'OWNER') {
            return NextResponse.json({ error: "Forbidden. Journey not found or not owned by you." }, { status: 403 });
        }

        // Delete the journey. This will cascade delete slides and library connections.
        await prisma.learningJourney.delete({
            where: { id: journeyId }
        });

        return NextResponse.json({ success: true, message: "Journey deleted successfully" });
    } catch (error) {
        console.error("Delete Journey Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
