import crypto from "crypto";

function getRefreshPepper() {
  const pepper =
    process.env.MOBILE_REFRESH_TOKEN_PEPPER ||
    process.env.MOBILE_JWT_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET;
  if (!pepper) {
    throw new Error(
      "Missing MOBILE_REFRESH_TOKEN_PEPPER (or MOBILE_JWT_SECRET/AUTH_SECRET fallback)."
    );
  }
  return pepper;
}

export function generateOpaqueRefreshToken() {
  // 48 bytes -> 64 chars base64url-ish; plus uuid to improve uniqueness across environments.
  const random = crypto.randomBytes(48).toString("base64url");
  return `${crypto.randomUUID()}.${random}`;
}

export function hashRefreshToken(refreshToken: string) {
  const pepper = getRefreshPepper();
  return crypto
    .createHash("sha256")
    .update(`${refreshToken}:${pepper}`)
    .digest("hex");
}

