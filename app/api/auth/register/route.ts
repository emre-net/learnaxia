
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";

const RegisterSchema = z.object({
    username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalıdır.").regex(/^[a-zA-Z0-9_-]+$/, "Kullanıcı adı sadece harf, rakam, tire ve alt çizgi içerebilir."),
    email: z.string().email("Geçersiz e-posta adresi"),
    password: z.string().min(6, "Parola en az 6 karakter olmalıdır."),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password, username } = RegisterSchema.parse(body);

        // 1. Check if email already exists
        const existingUserEmail = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUserEmail) {
            return NextResponse.json(
                { error: "Bu e-posta adresi ile zaten kayıt olunmuş." },
                { status: 409 }
            );
        }

        // 2. Check if handle (username) already exists
        const existingUserHandle = await prisma.user.findUnique({
            where: { handle: username },
        });

        if (existingUserHandle) {
            return NextResponse.json(
                { error: "Bu kullanıcı adı zaten alınmış." },
                { status: 409 }
            );
        }

        // 3. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Create User (emailVerified stays null until verification)
        await prisma.user.create({
            data: {
                name: username,
                email,
                password: hashedPassword,
                handle: username,
                image: `https://api.dicebear.com/7.x/initials/svg?seed=${username}`,
            },
        });

        // 5. Generate verification token and send email
        const verificationToken = await generateVerificationToken(email);
        await sendVerificationEmail(email, verificationToken.token);

        return NextResponse.json(
            { success: "Doğrulama e-postası gönderildi! Lütfen e-postanızı kontrol edin." },
            { status: 201 }
        );

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 });
        }
        console.error("Registration Error:", error);
        return NextResponse.json({ error: "Kayıt işlemi sırasında bir hata oluştu." }, { status: 500 });
    }
}
