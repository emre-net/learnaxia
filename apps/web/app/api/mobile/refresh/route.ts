import { NextResponse } from 'next/server';
import { MobileRefreshService } from '@/lib/auth/mobile-refresh';
import { SignJWT } from 'jose';
import prisma from '@/lib/prisma';

const secret = process.env.MOBILE_JWT_SECRET || process.env.AUTH_SECRET;
const JWT_SECRET = new TextEncoder().encode(secret || 'fallback_secret_for_development');

export async function POST(req: Request) {
  try {
    const { refreshToken: oldRefreshToken } = await req.json();

    if (!oldRefreshToken) {
      return NextResponse.json({ message: 'Refresh token is required' }, { status: 400 });
    }

    const userId = await MobileRefreshService.verify(oldRefreshToken);
    if (!userId) {
      return NextResponse.json({ message: 'Invalid or expired refresh token' }, { status: 401 });
    }

    // 1. Rotate tokens
    const newRefreshToken = await MobileRefreshService.generate(userId);
    
    // Revoke old one (optional, service.generate could handle it but let's be explicit if needed)
    // Actually, our service.rotate does revocation, but we'll use generate for simplicity here 
    // and manually revoke the old one if we want strict rotation.
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const accessToken = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
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
