import prisma from '@/lib/prisma';
import crypto from 'crypto';

export class MobileRefreshService {
  private static readonly TOKEN_EXPIRY_DAYS = 90;

  /**
   * Generates a new refresh token for a user and stores its hash in the DB.
   */
  static async generate(userId: string): Promise<string> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.TOKEN_EXPIRY_DAYS);

    await prisma.mobileRefreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return rawToken;
  }

  /**
   * Verifies a raw refresh token and returns the userId if valid.
   */
  static async verify(rawToken: string): Promise<string | null> {
    const tokenHash = this.hashToken(rawToken);
    const storedToken = await prisma.mobileRefreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      return null;
    }

    return storedToken.userId;
  }

  /**
   * Rotates an old refresh token for a new one.
   */
  static async rotate(oldRawToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    const tokenHash = this.hashToken(oldRawToken);
    const storedToken = await prisma.mobileRefreshToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      return null;
    }

    // 1. Revoke old token
    const newRawToken = crypto.randomBytes(32).toString('hex');
    const newHash = this.hashToken(newRawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.TOKEN_EXPIRY_DAYS);

    await prisma.$transaction([
      prisma.mobileRefreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date(), replacedByTokenId: 'PENDING' }, // We'll update ID after create
      }),
      // Prisma doesn't easily allow circular or forward refs in one go without ID
    ]);
    
    // Better way:
    const newToken = await prisma.mobileRefreshToken.create({
        data: {
            userId: storedToken.userId,
            tokenHash: newHash,
            expiresAt
        }
    });

    await prisma.mobileRefreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date(), replacedByTokenId: newToken.id }
    });

    return { 
        accessToken: "placeholder", // Will be signed by the caller
        refreshToken: newRawToken 
    };
  }

  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
