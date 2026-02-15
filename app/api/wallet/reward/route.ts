import { auth } from "@/auth";
import { WalletService } from "@/domains/wallet/wallet.service";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

// Simulated server-side validation schema
// In production, this would verify a signature from the Ad Provider (SSV)
const RewardClaimSchema = z.object({
    adNetwork: z.string(),
    referenceId: z.string().optional()
});

const COOLDOWN_MINUTES = 5;
const DAILY_REWARD_LIMIT = 10;

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const body = await req.json();
        const { adNetwork } = RewardClaimSchema.parse(body);

        // --- Rate Limiting ---

        // 1. Cooldown check: last reward must be at least COOLDOWN_MINUTES ago
        const lastReward = await prisma.tokenTransaction.findFirst({
            where: { userId, type: 'AD_REWARD' },
            orderBy: { createdAt: 'desc' }
        });

        if (lastReward) {
            const elapsed = Date.now() - lastReward.createdAt.getTime();
            if (elapsed < COOLDOWN_MINUTES * 60 * 1000) {
                return NextResponse.json({
                    error: "Too soon. Please wait before watching another ad."
                }, { status: 429 });
            }
        }

        // 2. Daily limit check
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dailyRewards = await prisma.tokenTransaction.count({
            where: { userId, type: 'AD_REWARD', createdAt: { gte: today } }
        });

        if (dailyRewards >= DAILY_REWARD_LIMIT) {
            return NextResponse.json({
                error: "Daily reward limit reached."
            }, { status: 429 });
        }

        // --- Grant Reward ---
        const REWARD_AMOUNT = 10;

        const wallet = await WalletService.credit(
            userId,
            REWARD_AMOUNT,
            'AD_REWARD',
            `Watched ${adNetwork} Ad`
        );

        return NextResponse.json({
            success: true,
            newBalance: wallet.balance,
            reward: REWARD_AMOUNT
        });

    } catch (error) {
        console.error("Ad Reward Error:", error);
        return NextResponse.json({ error: "Reward Failed" }, { status: 500 });
    }
}
