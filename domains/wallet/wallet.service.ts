import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class WalletService {

    /**
     * Get or create wallet for user.
     */
    static async getBalance(userId: string) {
        // Virtual Admin handling
        if (userId === "virtual-admin") {
            return {
                id: "virtual-admin-wallet",
                userId: "virtual-admin",
                balance: 999999,
                currency: "LEARN",
                createdAt: new Date(),
                updatedAt: new Date()
            };
        }

        let wallet = await prisma.tokenWallet.findUnique({
            where: { userId }
        });

        if (!wallet) {
            wallet = await prisma.tokenWallet.create({
                data: { userId }
            });
            // Log initial bonus
            await prisma.tokenTransaction.create({
                data: {
                    userId,
                    walletId: wallet.id,
                    amount: 50,
                    type: 'SIGNUP_BONUS',
                    description: 'Welcome Bonus'
                }
            });
        }

        return wallet;
    }

    /**
     * Add tokens to user wallet.
     * @param userId 
     * @param amount 
     * @param type Source of tokens (AD_REWARD, DAILY_LOGIN, etc.)
     */
    static async credit(userId: string, amount: number, type: string, description?: string) {
        if (amount <= 0) throw new Error("Credit amount must be positive");

        return await prisma.$transaction(async (tx) => {
            const wallet = await tx.tokenWallet.upsert({
                where: { userId },
                create: { userId, balance: 50 + amount }, // Initial 50 + credit
                update: { balance: { increment: amount } }
            });

            await tx.tokenTransaction.create({
                data: {
                    userId,
                    walletId: wallet.id,
                    amount,
                    type,
                    description
                }
            });

            return wallet;
        });
    }

    /**
     * Deduct tokens from user wallet.
     * Uses pessimistic locking (SELECT ... FOR UPDATE) to prevent race conditions / double-spending.
     */
    static async debit(userId: string, cost: number, type: string, description?: string) {
        if (cost <= 0) throw new Error("Debit cost must be positive");

        return await prisma.$transaction(async (tx) => {
            // Pessimistic lock: SELECT FOR UPDATE prevents concurrent reads
            const [wallet] = await tx.$queryRaw<{ id: string; balance: number }[]>(
                Prisma.sql`SELECT "id", "balance" FROM "TokenWallet" WHERE "userId" = ${userId} FOR UPDATE`
            );

            if (!wallet) throw new Error("Wallet not found");
            if (wallet.balance < cost) throw new Error("Insufficient funds");

            const updatedWallet = await tx.tokenWallet.update({
                where: { userId },
                data: { balance: { decrement: cost } }
            });

            await tx.tokenTransaction.create({
                data: {
                    userId,
                    walletId: wallet.id,
                    amount: -cost,
                    type,
                    description
                }
            });

            return updatedWallet;
        });
    }

    /**
     * Get transaction history.
     */
    static async getHistory(userId: string, limit = 20) {
        return await prisma.tokenTransaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }
}
