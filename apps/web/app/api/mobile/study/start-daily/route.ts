import { NextResponse } from "next/server";
import { getMobileUser } from "@/lib/auth/mobile-jwt";
import { startDailyStudySession } from "@/domains/study/daily-session.helper";

export async function POST(req: Request) {
    try {
        const user = await getMobileUser(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await startDailyStudySession(user.id);
        if (!payload) {
            return NextResponse.json({ error: "Bugün için tekrar edilecek kart yok." }, { status: 404 });
        }

        return NextResponse.json(payload);
    } catch (error) {
        console.error("[MOBILE_START_DAILY_SESSION_ERROR]:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
