import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";

const RegisterSchema = z.object({
  username: z
    .string()
    .min(3)
    .regex(/^[a-zA-Z0-9_-]+$/),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, username } = RegisterSchema.parse(body);

    const existingUserEmail = await prisma.user.findUnique({ where: { email } });
    if (existingUserEmail) {
      if (!existingUserEmail.emailVerified) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { email },
          data: { handle: username, password: hashedPassword },
        });

        const verificationToken = await generateVerificationToken(email);
        await sendVerificationEmail(email, verificationToken.token);
        return NextResponse.json(
          {
            success:
              "Hesabınız henüz doğrulanmamış. Bilgileriniz güncellendi ve yeni bir doğrulama e-postası gönderildi!",
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { error: "Bu e-posta adresi ile zaten kayıt olunmuş." },
        { status: 409 }
      );
    }

    const existingUserHandle = await prisma.user.findUnique({
      where: { handle: username },
    });
    if (existingUserHandle) {
      return NextResponse.json(
        { error: "Bu kullanıcı adı zaten alınmış." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        handle: username,
        image: `https://api.dicebear.com/7.x/initials/svg?seed=${username}`,
      },
    });

    const verificationToken = await generateVerificationToken(email);
    await sendVerificationEmail(email, verificationToken.token);

    return NextResponse.json(
      { success: "Doğrulama e-postası gönderildi! Lütfen e-postanızı kontrol edin." },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation Error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Mobile registration error:", error);
    return NextResponse.json(
      { error: "Kayıt işlemi sırasında bir hata oluştu." },
      { status: 500 }
    );
  }
}

