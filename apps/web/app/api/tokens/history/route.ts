export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMobileUser } from "@/lib/auth/mobile-jwt";
import { TokenService } from "@/domains/token/token.service";

async function resolveUserId(req: Request): Promise<string | null> {
    const mobileUser = await getMobileUser(req);
    if (mobileUser?.id) return mobileUser.id;
    const session = await auth();
    return session?.user?.id || null;
}

export async function GET(req: Request) {
    try {
        const userId = await resolveUserId(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const limit = Number(url.searchParams.get("limit") || "30");
        const history = await TokenService.getHistory(userId, Number.isFinite(limit) ? limit : 30);
        return NextResponse.json({ transactions: history });
    } catch (error) {
        console.error("GET /api/tokens/history error:", error);
        return NextResponse.json({ error: "İşlem geçmişi alınamadı." }, { status: 500 });
    }
}
