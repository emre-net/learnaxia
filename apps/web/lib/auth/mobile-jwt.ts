import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || 'fallback_secret_for_development');

export async function getMobileUser(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { id: string; email: string; name: string; role?: string };
  } catch (error) {
    return null;
  }
}

export function extractBearerToken(header: string | null): string | null {
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.split(' ')[1];
}

export async function verifyMobileAccessToken(token: string) {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return {
    userId: payload.id as string,
    email: payload.email as string,
    tokenVersion: payload.tokenVersion as number | undefined
  };
}
