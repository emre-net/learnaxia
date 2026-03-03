import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { JourneyPlayer } from "./journey-player";

export default async function JourneySessionPage({ params }: { params: { journeyId: string } }) {
    const session = await auth();
    if (!session || !session.user?.id) {
        redirect("/auth/login");
    }

    const journeyId = params.journeyId;

    // Validate access using userJourneyLibrary 
    const isOwner = await prisma.userJourneyLibrary.findFirst({
        where: {
            userId: session.user.id,
            journeyId: journeyId,
        }
    });

    if (!isOwner) {
        return notFound();
    }

    const journey = await prisma.learningJourney.findUnique({
        where: { id: journeyId },
        include: {
            slides: {
                orderBy: { order: "asc" }
            }
        }
    });

    if (!journey) {
        return notFound();
    }

    // Pass the journey to our client-side interactive player
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pt-16">
            <JourneyPlayer initialJourney={journey} />
        </div>
    );
}
