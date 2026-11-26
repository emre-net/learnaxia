import { auth } from "@/auth";
import { startDailyStudySession } from "@/domains/study/daily-session.helper";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await startDailyStudySession(session.user.id);
        if (!payload) {
            return NextResponse.json({ error: "No reviews due today." }, { status: 404 });
        }

        return NextResponse.json(payload);
    } catch (error) {
        console.error("[START_DAILY_SESSION_ERROR]:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
