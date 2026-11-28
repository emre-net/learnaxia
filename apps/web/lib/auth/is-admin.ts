/**
 * Edge-safe admin authorization check.
 * Rejects empty/unset ADMIN_EMAIL cleanly so undefined === undefined never passes.
 */
export function isAdminUser(
    user?: { role?: string | null; email?: string | null } | null
): boolean {
    if (!user) return false;
    if (user.role === "ADMIN") return true;

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const userEmail = user.email?.trim().toLowerCase();
    return Boolean(adminEmail && userEmail && userEmail === adminEmail);
}
