import { NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import prisma from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || 'fallback_secret_for_development');

export async function POST(req: Request) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return NextResponse.json({ message: 'Refresh token required' }, { status: 401 });
    }

    try {
      const { payload } = await jwtVerify(refreshToken, JWT_SECRET);

      const user = await prisma.user.findUnique({
        where: { id: payload.id as string },
      });

      if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 401 });
      }

      const newAccessToken = await new SignJWT({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d')
        .sign(JWT_SECRET);

      const newRefreshToken = await new SignJWT({ id: user.id })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('90d')
        .sign(JWT_SECRET);

      return NextResponse.json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      });

    } catch (verifyError) {
      return NextResponse.json({ message: 'Invalid refresh token' }, { status: 401 });
    }

  } catch (error) {
    console.error('Mobile Refresh Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
