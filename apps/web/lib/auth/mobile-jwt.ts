import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";

const MobileAccessTokenPayloadSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email().nullable().optional(),
  role: z.string().default("USER"),
  tokenVersion: z.number().int().nonnegative().default(1),
});

export type MobileAccessTokenPayload = z.infer<typeof MobileAccessTokenPayloadSchema>;

function getMobileJwtSecret() {
  const secret =
    process.env.MOBILE_JWT_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      "Missing MOBILE_JWT_SECRET (or AUTH_SECRET/NEXTAUTH_SECRET fallback)."
    );
  }
  return new TextEncoder().encode(secret);
}

const ISSUER = "learnaxia";
const AUDIENCE = "learnaxia-mobile";

export async function signMobileAccessToken(payload: MobileAccessTokenPayload) {
  const parsed = MobileAccessTokenPayloadSchema.parse(payload);
  return new SignJWT(parsed)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(parsed.userId)
    .setExpirationTime("1h")
    .sign(getMobileJwtSecret());
}

export async function verifyMobileAccessToken(token: string) {
  const { payload } = await jwtVerify(token, getMobileJwtSecret(), {
    issuer: ISSUER,
    audience: AUDIENCE,
  });

  return MobileAccessTokenPayloadSchema.parse({
    userId: payload.userId,
    email: payload.email ?? null,
    role: payload.role ?? "USER",
    tokenVersion: payload.tokenVersion ?? 1,
  });
}

export function extractBearerToken(authorizationHeader: string | null) {
  if (!authorizationHeader) return null;
  const [scheme, token] = authorizationHeader.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer") return null;
  if (!token) return null;
  return token.trim();
}

