import prisma from "@/lib/prisma";

export async function checkRateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const { key, limit, windowMs } = opts;
  const now = Date.now();

  // FIXED WINDOW: Window sınırları deterministik ve sabit.
  // Örneğin windowMs=60000 (1 dakika):
  // 14:00:00–14:00:59 = Window 1, 14:01:00–14:01:59 = Window 2
  // resetAt her request'te uzamaz; window bitişine sabitlenir.
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const windowEnd = windowStart + windowMs;
  const resetAt = new Date(windowEnd);

  return await prisma.$transaction(async (tx) => {
    const current = await tx.apiRateLimit.findUnique({ where: { key } });

    // Kayıt yok veya window süresi dolmuş: sayacı sıfırla
    if (!current || current.resetAt.getTime() <= now) {
      await tx.apiRateLimit.upsert({
        where: { key },
        update: { count: 1, resetAt },
        create: { key, count: 1, resetAt },
      });
      return { allowed: true as const, remaining: Math.max(0, limit - 1), resetAt };
    }

    const nextCount = current.count + 1;
    if (nextCount > limit) {
      return { allowed: false as const, remaining: 0, resetAt: current.resetAt };
    }

    const updated = await tx.apiRateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    });

    return {
      allowed: true as const,
      remaining: Math.max(0, limit - updated.count),
      resetAt: updated.resetAt,
    };
  });
}
