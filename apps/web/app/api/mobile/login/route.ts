import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { LoginSchema } from '@learnaxia/shared';
import { SignJWT } from 'jose';
import { MobileRefreshService } from '@/lib/auth/mobile-refresh';
import { checkRateLimit } from '@/lib/rate-limit';

const JWT_EXPIRY_DAYS = 1;

function getJwtSecret(): Uint8Array {
  const secret = process.env.MOBILE_JWT_SECRET || process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('MOBILE_JWT_SECRET is missing in production environment');
  }
  return new TextEncoder().encode(secret || 'development_fallback_secret');
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';

    let json;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ message: 'Invalid JSON request body' }, { status: 400 });
    }

    const validatedData = LoginSchema.safeParse(json);
    if (!validatedData.success) {
      return NextResponse.json(
        {
          message: validatedData.error.issues[0]?.message || 'Validation error',
          errors: validatedData.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const email = validatedData.data.email.trim().toLowerCase();
    const password = validatedData.data.password;

    const ipLimit = await checkRateLimit({
      key: `login-ip:${ip}`,
      limit: 20,
      windowMs: 15 * 60 * 1000,
    });

    const emailLimit = await checkRateLimit({
      key: `login-email:${email}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!ipLimit.allowed || !emailLimit.allowed) {
      return NextResponse.json(
        { message: 'Çok fazla giriş denemesi yaptınız. Lütfen 15 dakika bekleyin.' },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        handle: true,
        image: true,
        password: true,
        role: true,
        language: true,
        status: true,
        emailVerified: true,
        deletedAt: true,
        sessionVersion: true,
      },
    });

    if (!user || !user.password || user.deletedAt || user.status !== 'ACTIVE') {
      return NextResponse.json({ message: 'Geçersiz e-posta veya şifre' }, { status: 401 });
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        {
          message: 'E-posta adresiniz doğrulanmamış. Lütfen gelen kutunuzu kontrol edin.',
          code: 'EMAIL_NOT_VERIFIED',
        },
        { status: 403 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ message: 'Geçersiz e-posta veya şifre' }, { status: 401 });
    }

    const accessToken = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tokenVersion: user.sessionVersion ?? 1,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${JWT_EXPIRY_DAYS}d`)
      .sign(getJwtSecret());

    const refreshToken = await MobileRefreshService.generate(user.id);

    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        handle: user.handle,
        image: user.image,
        language: user.language,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Mobile Login Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
