import { auth } from "@/auth";
import { WalletService } from "@/domains/wallet/wallet.service";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const wallet = await WalletService.getBalance(userId);
        const history = await WalletService.getHistory(userId);

        return NextResponse.json({
            balance: wallet.balance,
            currency: wallet.currency,
            history
        });
    } catch (error) {
        console.error("Wallet API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
