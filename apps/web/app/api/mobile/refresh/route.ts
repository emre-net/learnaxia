import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { signMobileAccessToken } from "@/lib/auth/mobile-jwt";
import {
  generateOpaqueRefreshToken,
  hashRefreshToken,
} from "@/lib/auth/mobile-refresh";
import { checkRateLimit } from "@/lib/rate-limit";

const RefreshSchema = z.object({
  refreshToken: z.string().min(20),
});

function rateLimitKeyFromRequest(req: Request) {
  const xf = req.headers.get("x-forwarded-for");
  const ip = (xf ? xf.split(",")[0] : null)?.trim() || "anonymous";
  return ip;
}

export async function POST(req: Request) {
  try {
    const ip = rateLimitKeyFromRequest(req);
    const rl = await checkRateLimit({
      key: `mobile-refresh:ip:${ip}`,
      limit: 120,
      windowMs: 10 * 60 * 1000,
    });
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const { refreshToken } = RefreshSchema.parse(body);

    const tokenHash = hashRefreshToken(refreshToken);
    const record = await prisma.mobileRefreshToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.revokedAt || record.expiresAt <= new Date()) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: record.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        handle: true,
        language: true,
        status: true,
        deletedAt: true,
        sessionVersion: true,
      },
    });

    if (!user || user.deletedAt || user.status !== "ACTIVE") {
      // Revoke token on suspicious state
      await prisma.mobileRefreshToken.update({
        where: { id: record.id },
        data: { revokedAt: new Date() },
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rotate refresh token (single-use style)
    const newRefreshToken = generateOpaqueRefreshToken();
    const newHash = hashRefreshToken(newRefreshToken);

    const created = await prisma.mobileRefreshToken.create({
      data: {
        userId: user.id,
        tokenHash: newHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      select: { id: true },
    });

    await prisma.mobileRefreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date(), replacedByTokenId: created.id },
    });

    const accessToken = await signMobileAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role || "USER",
      tokenVersion: user.sessionVersion ?? 1,
    });

    return NextResponse.json({
      accessToken,
      refreshToken: newRefreshToken,
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
    console.error("Mobile refresh error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

