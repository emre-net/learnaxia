import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { MobileLoginSchema } from '@/lib/validations/mobile-auth';
import { SignJWT } from 'jose';
import { MobileRefreshService } from '@/lib/auth/mobile-refresh';

import { checkRateLimit } from "@/lib/rate-limit";

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
    } catch (e) {
        return NextResponse.json({ message: 'Invalid JSON request body' }, { status: 400 });
    }
    const validatedData = MobileLoginSchema.safeParse(json);

    if (!validatedData.success) {
      return NextResponse.json({ 
        message: 'Validation error', 
        errors: validatedData.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { email, password } = validatedData.data;

    // 0. Rate Limiting (Hardened)
    // Limit by IP
    const ipLimit = await checkRateLimit({
        key: `login-ip:${ip}`,
        limit: 20,
        windowMs: 15 * 60 * 1000 // 15 mins
    });

    // Limit by Email (more strict)
    const emailLimit = await checkRateLimit({
        key: `login-email:${email}`,
        limit: 5,
        windowMs: 15 * 60 * 1000 // 15 mins
    });

    if (!ipLimit.allowed || !emailLimit.allowed) {
        return NextResponse.json({ 
            message: 'Çok fazla giriş denemesi yaptınız. Lütfen 15 dakika bekleyin.' 
        }, { status: 429 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, image: true, password: true, role: true, emailVerified: true, deletedAt: true }
    });

    if (!user || !user.password || user.deletedAt) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // S7: E-posta doğrulama kontrolü
    if (!user.emailVerified) {
      return NextResponse.json({
        message: 'E-posta adresiniz doğrulanmamış. Lütfen gelen kutunuzu kontrol edin.',
        code: 'EMAIL_NOT_VERIFIED'
      }, { status: 403 });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const accessToken = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${JWT_EXPIRY_DAYS}d`)
      .sign(getJwtSecret());

    // Provide a SECURE refresh token mechanism
    const refreshToken = await MobileRefreshService.generate(user.id);

    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image
      }
    });
  } catch (error: any) {
    console.error('Mobile Login Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
