import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';

// Secret validation is deferred to runtime (not module-load time)
// so Next.js can safely import this module during build without throwing.
function getJwtSecret(): Uint8Array {
  const secret = process.env.MOBILE_JWT_SECRET || process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('MOBILE_JWT_SECRET or AUTH_SECRET must be set in production');
  }
  return new TextEncoder().encode(secret || 'fallback_secret_for_development');
}

export async function getMobileUser(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const userId = typeof payload.id === 'string' ? payload.id : null;
    if (!userId) return null;

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        deletedAt: true,
        sessionVersion: true,
      },
    });

    if (!dbUser || dbUser.deletedAt || dbUser.status !== 'ACTIVE') {
      return null;
    }

    const tokenVersion = typeof payload.tokenVersion === 'number' ? payload.tokenVersion : 1;
    if ((dbUser.sessionVersion ?? 1) !== tokenVersion) {
      return null;
    }

    return {
      id: dbUser.id,
      email: dbUser.email ?? (typeof payload.email === 'string' ? payload.email : ''),
      name: dbUser.name ?? (typeof payload.name === 'string' ? payload.name : ''),
      role: dbUser.role,
    };
  } catch {
    return null;
  }
}

export function extractBearerToken(header: string | null): string | null {
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.split(' ')[1];
}

export async function verifyMobileAccessToken(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret());
  return {
    userId: payload.id as string,
    email: payload.email as string,
    role: payload.role as string | undefined,
    tokenVersion: payload.tokenVersion as number | undefined,
  };
}
