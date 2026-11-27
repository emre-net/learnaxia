export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMobileUser } from "@/lib/auth/mobile-jwt";
import { TokenService } from "@/domains/token/token.service";
import { TOKEN_CONFIG } from "@learnaxia/shared";

/**
 * Non-production sandbox reward endpoint ONLY for local developer testing when AdMob SSV
 * cannot call localhost over the public internet. Disabled permanently in production.
 */
export async function POST(req: Request) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Disabled in production" }, { status: 403 });
    }

    try {
        const mobileUser = await getMobileUser(req);
        const session = mobileUser?.id ? null : await auth();
        const userId = mobileUser?.id || session?.user?.id;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const txId = `dev_ad_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const result = await TokenService.creditRewardedAd({
            userId,
            transactionId: txId,
            rewardAmount: TOKEN_CONFIG.REWARDED_AD_BONUS,
            metadata: { sandbox: true },
        });

        if (result.capReached) {
            return NextResponse.json(
                { error: "Günlük reklam ödülü limitine ulaştınız.", wallet: result.wallet },
                { status: 429 }
            );
        }

        return NextResponse.json({ ok: true, wallet: result.wallet });
    } catch (error) {
        console.error("POST /api/ads/dev-reward error:", error);
        return NextResponse.json({ error: "Sandbox ödül işlenemedi." }, { status: 500 });
    }
}
