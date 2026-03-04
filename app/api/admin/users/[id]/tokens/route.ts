import { auth } from "@/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { WalletService } from "@/domains/wallet/wallet.service";

export async function POST(req: Request, context: any) {
    const params = context.params;
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const adminUser = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (adminUser?.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
        }

        const targetUserId = params.id;
        const body = await req.json();
        const { amount } = body;

        if (typeof amount !== "number" || amount === 0) {
            return NextResponse.json({ error: "Geçerli bir token miktarı girilmedi." }, { status: 400 });
        }

        let updatedWallet;

        if (amount > 0) {
            updatedWallet = await WalletService.credit(targetUserId, amount, 'ADMIN_GRANT', `Admin (${adminUser.email}) tarafından eklendi.`);
        } else {
            // Debit absolute value
            const cost = Math.abs(amount);

            try {
                updatedWallet = await WalletService.debit(targetUserId, cost, 'ADMIN_REVOKE', `Admin (${adminUser.email}) tarafından eksiltildi.`);
            } catch (debitErr: any) {
                return NextResponse.json({ error: debitErr.message || "Kullanıcının silinecek kadar token bakiyesi yok veya cüzdanı oluşturulmamış." }, { status: 400 });
            }
        }

        // Action'ı SystemLog tablosuna kaydet
        await prisma.systemLog.create({
            data: {
                level: "INFO",
                environment: process.env.NODE_ENV || "development",
                source: "ADMIN_PANEL",
                service: "wallet",
                userId: session.user.id,
                message: `Yönetici ${adminUser.email}, ${targetUserId} ID'li kullanıcıya ${amount} değerinde token işlemi uyguladı.`
            }
        });

        return NextResponse.json({
            success: true,
            wallet: updatedWallet,
            message: "Token işlemi başarıyla tamamlandı."
        });

    } catch (error: any) {
        console.error("Admin Token Update Error:", error);
        return NextResponse.json({ error: "Sunucu hatası oluştu." }, { status: 500 });
    }
}
