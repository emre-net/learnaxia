import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getVerificationTokenByToken } from "@/lib/tokens";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json({ error: "Token gerekli." }, { status: 400 });
        }

        const existingToken = await getVerificationTokenByToken(token);

        if (!existingToken) {
            return NextResponse.json({ error: "Geçersiz doğrulama linki." }, { status: 400 });
        }

        const hasExpired = new Date(existingToken.expires) < new Date();

        if (hasExpired) {
            return NextResponse.json({ error: "Doğrulama linki süresi dolmuş." }, { status: 400 });
        }

        const existingUser = await prisma.user.findFirst({
            where: { email: existingToken.identifier },
        });

        if (!existingUser) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 400 });
        }

        // Mark email as verified
        await prisma.user.update({
            where: { id: existingUser.id },
            data: {
                emailVerified: new Date(),
            },
        });

        // Delete the used token
        await prisma.verificationToken.delete({
            where: { token },
        });

        return NextResponse.json({ success: "E-posta doğrulandı!" });
    } catch (error) {
        console.error("Verification error:", error);
        return NextResponse.json({ error: "Doğrulama sırasında bir hata oluştu." }, { status: 500 });
    }
}
