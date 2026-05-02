import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { MobileRegisterSchema } from '@learnaxia/shared';
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

    // 0. Rate Limiting for account creation
    const ipLimit = await checkRateLimit({
        key: `register-ip:${ip}`,
        limit: 3, // 3 registrations per hour per IP
        windowMs: 60 * 60 * 1000
    });

    if (!ipLimit.allowed) {
        return NextResponse.json({ 
            message: 'Çok fazla hesap oluşturdunuz. Lütfen 1 saat bekleyin.' 
        }, { status: 429 });
    }

    let json;
    try {
        json = await req.json();
    } catch (e) {
        return NextResponse.json({ message: 'Invalid JSON request body' }, { status: 400 });
    }
    const validatedData = MobileRegisterSchema.safeParse(json);

    if (!validatedData.success) {
      return NextResponse.json({ 
        message: 'Validation error', 
        errors: validatedData.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { name, email, password } = validatedData.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const accessToken = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${JWT_EXPIRY_DAYS}d`)
      .sign(JWT_SECRET);

    // Use secure refresh token with rotation & revocation support
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
    }, { status: 201 });
  } catch (error) {
    console.error('Mobile Register Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
