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
   * IMPLEMENTS REUSE DETECTION: If a previously revoked token is sent again, 
   * this indicates a stolen token. We IMMEDIATELY revoke all tokens for this user.
   */
  static async rotate(oldRawToken: string): Promise<{ refreshToken: string } | null> {
    const tokenHash = this.hashToken(oldRawToken);
    const storedToken = await prisma.mobileRefreshToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken) return null;

    // REUSE DETECTION:
    // If token already revoked, some malicious entity might be trying to reuse it.
    if (storedToken.revokedAt) {
        console.warn(`[SECURITY ALERT] Refresh token reuse detected for userId: ${storedToken.userId}. Revoking all tokens.`);
        
        // REVOKE ALL TOKENS for this user to mitigate compromise
        await prisma.mobileRefreshToken.updateMany({
            where: { userId: storedToken.userId, revokedAt: null },
            data: { revokedAt: new Date(), replacedByTokenId: 'COMPROMISED' }
        });
        
        return null; // Force user to re-login everywhere
    }

    // EXPIRY CHECK:
    if (storedToken.expiresAt < new Date()) {
      return null;
    }

    // 1. Generate new token
    const newRawToken = crypto.randomBytes(32).toString('hex');
    const newHash = this.hashToken(newRawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.TOKEN_EXPIRY_DAYS);

    // 2. Perform rotation in a transaction to ensure atomicity
    const newToken = await prisma.$transaction(async (tx) => {
        // Create new token
        const created = await tx.mobileRefreshToken.create({
            data: {
                userId: storedToken.userId,
                tokenHash: newHash,
                expiresAt,
            }
        });

        // Revoke old token and link it to the new one
        await tx.mobileRefreshToken.update({
            where: { id: storedToken.id },
            data: { 
                revokedAt: new Date(), 
                replacedByTokenId: created.id 
            }
        });

        return created;
    });

    return { 
        refreshToken: newRawToken 
    };
  }

  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
