import prisma from "@/lib/prisma";

export async function checkRateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const { key, limit, windowMs } = opts;
  const now = new Date();
  const newResetAt = new Date(Date.now() + windowMs);

  const current = await prisma.apiRateLimit.findUnique({ where: { key } });

  if (!current || current.resetAt <= now) {
    await prisma.apiRateLimit.upsert({
      where: { key },
      update: { count: 1, resetAt: newResetAt },
      create: { key, count: 1, resetAt: newResetAt },
    });
    return { allowed: true as const, remaining: Math.max(0, limit - 1), resetAt: newResetAt };
  }

  const nextCount = current.count + 1;
  if (nextCount > limit) {
    return { allowed: false as const, remaining: 0, resetAt: current.resetAt };
  }

  const updated = await prisma.apiRateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });

  return {
    allowed: true as const,
    remaining: Math.max(0, limit - updated.count),
    resetAt: updated.resetAt,
  };
}

