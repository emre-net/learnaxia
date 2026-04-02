import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { MobileLoginSchema } from '@/lib/validations/mobile-auth';
import { SignJWT } from 'jose';
import { MobileRefreshService } from '@/lib/auth/mobile-refresh';

import { checkRateLimit } from "@/lib/rate-limit";

const secret = process.env.MOBILE_JWT_SECRET || process.env.AUTH_SECRET;

if (!secret && process.env.NODE_ENV === 'production') {
  throw new Error('MOBILE_JWT_SECRET is missing in production environment');
}

const JWT_EXPIRY_DAYS = 1; 
const JWT_SECRET = new TextEncoder().encode(secret || 'development_fallback_secret');

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

    console.log(`[Mobile Login] Attempt for: ${email} from ${ip}`);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
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
      .setExpirationTime(`${JWT_EXPIRY_DAYS}d`) // Shorter expiration for security
      .sign(JWT_SECRET);

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
    return NextResponse.json({ message: 'Internal server error', detail: error?.message || String(error) }, { status: 500 });
  }
}
