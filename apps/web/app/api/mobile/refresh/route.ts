import { NextResponse } from 'next/server';
import { MobileRefreshService } from '@/lib/auth/mobile-refresh';
import { SignJWT } from 'jose';
import prisma from '@/lib/prisma';

const secret = process.env.MOBILE_JWT_SECRET || process.env.AUTH_SECRET;

if (!secret && process.env.NODE_ENV === 'production') {
  throw new Error('MOBILE_JWT_SECRET is missing in production environment');
}

const JWT_EXPIRY_DAYS = 1; 
const JWT_SECRET = new TextEncoder().encode(secret || 'development_fallback_secret');

export async function POST(req: Request) {
  try {
    let json;
    try {
        json = await req.json();
    } catch (e) {
        return NextResponse.json({ message: 'Invalid JSON request body' }, { status: 400 });
    }

    const { refreshToken: oldRefreshToken } = json;

    if (!oldRefreshToken) {
      return NextResponse.json({ message: 'Refresh token is required' }, { status: 400 });
    }

    const userId = await MobileRefreshService.verify(oldRefreshToken);
    if (!userId) {
      return NextResponse.json({ message: 'Invalid or expired refresh token' }, { status: 401 });
    }

    // 1. Rotate tokens and revoke old one properly
    const rotationResult = await MobileRefreshService.rotate(oldRefreshToken);
    if (!rotationResult) {
      return NextResponse.json({ message: 'Invalid or expired refresh token' }, { status: 401 });
    }

    const { refreshToken: newRefreshToken } = rotationResult;
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // 2. Generate new access token with correct expiration
    const accessToken = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${JWT_EXPIRY_DAYS}d`) // 1 day expiration for security
      .sign(JWT_SECRET);

    return NextResponse.json({
      accessToken,
      refreshToken: newRefreshToken,
    });

  } catch (error: any) {
    console.error('Mobile Refresh Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
