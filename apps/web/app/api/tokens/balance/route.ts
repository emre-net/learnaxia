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

        const wallet = await TokenService.getWalletSummary(userId);
        return NextResponse.json(wallet);
    } catch (error) {
        console.error("GET /api/tokens/balance error:", error);
        return NextResponse.json({ error: "Jeton bilgisi alınamadı." }, { status: 500 });
    }
}
