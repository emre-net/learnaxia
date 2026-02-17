import { v4 as uuidv4 } from "uuid";
import prisma from "@/lib/prisma";

export async function generateVerificationToken(email: string) {
    const token = uuidv4();
    const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 hour

    // Delete any existing tokens for this email
    await prisma.verificationToken.deleteMany({
        where: { identifier: email },
    });

    const verificationToken = await prisma.verificationToken.create({
        data: {
            identifier: email,
            token,
            expires,
        },
    });

    return verificationToken;
}

export async function getVerificationTokenByToken(token: string) {
    try {
        return await prisma.verificationToken.findUnique({
            where: { token },
        });
    } catch {
        return null;
    }
}
