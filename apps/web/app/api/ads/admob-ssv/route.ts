export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TokenService } from "@/domains/token/token.service";
import { verifyAdMobCallbackRequest } from "@/lib/ads/admob-ssv";
import { TOKEN_CONFIG } from "@learnaxia/shared";

/**
 * Official Google AdMob Server-Side Verification (SSV) webhook.
 * Expects GET query params from Google with trailing `signature` & `key_id`.
 */
export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const userId = url.searchParams.get("user_id") || url.searchParams.get("custom_data");
        const transactionId = url.searchParams.get("transaction_id");
        const adUnit = url.searchParams.get("ad_unit") || undefined;
        const adNetwork = url.searchParams.get("ad_network") || undefined;
        const rewardItem = url.searchParams.get("reward_item") || undefined;

        if (!userId || !transactionId) {
            return NextResponse.json({ error: "Missing user_id or transaction_id" }, { status: 400 });
        }

        const isVerified = await verifyAdMobCallbackRequest(req.url);
        if (!isVerified) {
            await prisma.systemLog.create({
                data: {
                    level: "WARN",
                    environment: process.env.NODE_ENV || "development",
                    service: "admob-ssv",
                    message: "Rejected unverified AdMob SSV callback",
                    source: "SERVER",
                    metadata: { userId, transactionId, adUnit },
                },
            }).catch(() => {});

            return NextResponse.json({ error: "Invalid AdMob signature" }, { status: 403 });
        }

        const result = await TokenService.creditRewardedAd({
            userId,
            transactionId,
            rewardAmount: TOKEN_CONFIG.REWARDED_AD_BONUS,
            metadata: { adUnit, adNetwork, rewardItem },
        });

        // Always respond 200 to verified AdMob webhooks (even duplicates/cap) so AdMob stops retrying
        return NextResponse.json({
            ok: true,
            credited: result.credited,
            duplicate: Boolean(result.duplicate),
            capReached: Boolean(result.capReached),
        });
    } catch (error) {
        console.error("AdMob SSV error:", error);
        return NextResponse.json({ error: "SSV processing error" }, { status: 500 });
    }
}
