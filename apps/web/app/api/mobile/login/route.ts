import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { MobileLoginSchema } from '@/lib/validations/mobile-auth';
import { SignJWT } from 'jose';
import { MobileRefreshService } from '@/lib/auth/mobile-refresh';

const secret = process.env.MOBILE_JWT_SECRET || process.env.AUTH_SECRET;
const JWT_EXPIRY_DAYS = 1; // 1 day for access token (security best practice)
const JWT_SECRET = new TextEncoder().encode(secret || 'fallback_secret_for_development');

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const validatedData = MobileLoginSchema.safeParse(json);

    if (!validatedData.success) {
      return NextResponse.json({ 
        message: 'Validation error', 
        errors: validatedData.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { email, password } = validatedData.data;

    console.log(`[Mobile Login] Attempt for: ${email}`);

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
