import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { RegisterSchema } from "@learnaxia/shared";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
    try {
        const ip = req.headers.get('x-forwarded-for') || 'unknown';

        // Rate limit: IP başına saatte 3 kayıt
        const ipLimit = await checkRateLimit({
            key: `register:${ip}`,
            limit: 3,
            windowMs: 60 * 60 * 1000
        });
        if (!ipLimit.allowed) {
            return NextResponse.json({ error: 'Bu IP adresinden çok fazla hesap oluşturuldu. Lütfen 1 saat bekleyin.' }, { status: 429 });
        }

        const rawBody = await req.json();
        const normalizedInput = {
            ...rawBody,
            handle: rawBody?.handle ?? rawBody?.username,
        };
        const validated = RegisterSchema.parse(normalizedInput);
        const email = validated.email.trim().toLowerCase();
        const handle = validated.handle.trim().toLowerCase();
        const name = validated.name?.trim() ? validated.name.trim() : null;
        const password = validated.password;

        // 1. Check if email already exists
        const existingUserEmail = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUserEmail) {
            if (!existingUserEmail.emailVerified) {
                const hashedPassword = await bcrypt.hash(password, 10);

                await prisma.user.update({
                    where: { email },
                    data: {
                        handle,
                        ...(name !== null && { name }),
                        password: hashedPassword,
                    }
                });

                const verificationToken = await generateVerificationToken(email);
                await sendVerificationEmail(email, verificationToken.token);
                return NextResponse.json(
                    { success: "Hesabınız henüz doğrulanmamış. Bilgileriniz güncellendi ve yeni bir doğrulama e-postası gönderildi!" },
                    { status: 200 }
                );
            }

            return NextResponse.json(
                { error: "Bu e-posta adresi ile zaten kayıt olunmuş." },
                { status: 409 }
            );
        }

        // 2. Check if handle already exists
        const existingUserHandle = await prisma.user.findUnique({
            where: { handle },
        });

        if (existingUserHandle) {
            return NextResponse.json(
                { error: "Bu kullanıcı adı zaten alınmış." },
                { status: 409 }
            );
        }

        // 3. Hash password & create User (emailVerified stays null until verified)
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                handle,
                image: `https://api.dicebear.com/7.x/initials/svg?seed=${handle}`,
            },
        });

        // 4. Send verification email
        const verificationToken = await generateVerificationToken(email);
        await sendVerificationEmail(email, verificationToken.token);

        return NextResponse.json(
            { success: "Doğrulama e-postası gönderildi! Lütfen e-postanızı kontrol edin." },
            { status: 201 }
        );

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                error: error.issues[0]?.message || "Geçersiz kayıt bilgileri.",
                details: error.issues
            }, { status: 400 });
        }
        console.error("Registration Error:", error);
        return NextResponse.json(
            { error: "Kayıt işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin." },
            { status: 500 }
        );
    }
}
