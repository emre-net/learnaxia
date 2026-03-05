import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signMobileAccessToken } from "@/lib/auth/mobile-jwt";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateOpaqueRefreshToken, hashRefreshToken } from "@/lib/auth/mobile-refresh";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

function rateLimitKeyFromRequest(req: Request) {
  const xf = req.headers.get("x-forwarded-for");
  const ip = (xf ? xf.split(",")[0] : null)?.trim() || "anonymous";
  return ip;
}

export async function POST(req: Request) {
  try {
    const ip = rateLimitKeyFromRequest(req);
    const body = await req.json();
    const { email, password } = LoginSchema.parse(body);

    const rlIp = await checkRateLimit({
      key: `mobile-login:ip:${ip}`,
      limit: 60,
      windowMs: 10 * 60 * 1000,
    });
    if (!rlIp.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const rlEmail = await checkRateLimit({
      key: `mobile-login:email:${email.toLowerCase()}`,
      limit: 30,
      windowMs: 10 * 60 * 1000,
    });
    if (!rlEmail.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Email not verified" },
        { status: 403 }
      );
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const accessToken = await signMobileAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role || "USER",
      tokenVersion: user.sessionVersion ?? 1,
    });

    const refreshToken = generateOpaqueRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);
    await prisma.mobileRefreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      expiresIn: 3600,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        handle: user.handle,
        language: user.language,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation Error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Mobile login error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

