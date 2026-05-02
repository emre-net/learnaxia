import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import prisma from "@/lib/prisma"
import { authConfig } from "./auth.config"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { headers } from "next/headers"
import { extractBearerToken, verifyMobileAccessToken } from "@/lib/auth/mobile-jwt"
import type { Session } from "next-auth"

const nextAuth = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    session: { strategy: "database" },
    callbacks: {
        async session({ session, user }) {
            if (user && session.user) {
                session.user.id = user.id;
                (session.user as any).role = (user as any).role;
            }
            return session;
        },
        ...authConfig.callbacks,
    },
    providers: [
        ...authConfig.providers,
        Credentials({
            async authorize(credentials) {
                try {
                    const parsedCredentials = z
                        .object({ email: z.string().email(), password: z.string().min(6) })
                        .safeParse(credentials);

                    if (parsedCredentials.success) {
                        const { email, password } = parsedCredentials.data;

                        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
                            // Ensure the admin user exists in the database to allow FK relations
                            let adminUser = await prisma.user.findUnique({ where: { email } });

                            if (!adminUser) {
                                adminUser = await prisma.user.create({
                                    data: {
                                        email,
                                        name: "Admin",
                                        role: "ADMIN",
                                        handle: "admin",
                                        emailVerified: new Date(),
                                    }
                                });
                            } else if (adminUser.role !== 'ADMIN') {
                                // Ensure the existing user with this email has ADMIN role
                                adminUser = await prisma.user.update({
                                    where: { id: adminUser.id },
                                    data: { role: 'ADMIN' }
                                });
                            }

                            return {
                                id: adminUser.id,
                                email: adminUser.email,
                                name: adminUser.name,
                                role: "ADMIN"
                            };
                        }

                        const user = await prisma.user.findUnique({ where: { email } });
                        if (!user || !user.password) return null;
                        if (!user.emailVerified) return null;

                        const passwordsMatch = await bcrypt.compare(password, user.password);
                        if (passwordsMatch) return user;
                    }
                    return null;
                } catch (error) {
                    console.error("[Auth] Authorize error (likely DB issue):", error);
                    return null;
                }
            },
        }),
    ],
    events: {
        async createUser({ user }) {
            try {
                if (user.id && user.email) {
                    const emailPrefix = user.email.split('@')[0];
                    const baseHandle = emailPrefix.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                    let handle = baseHandle || `user${Math.floor(Math.random() * 10000)}`;

                    let isUnique = false;
                    let finalHandle = handle;
                    let attempts = 0;

                    while (!isUnique && attempts < 10) {
                        const existing = await prisma.user.findUnique({ where: { handle: finalHandle } });
                        if (!existing) {
                            isUnique = true;
                        } else {
                            attempts++;
                            finalHandle = `${handle}${Math.floor(Math.random() * 10000)}`;
                        }
                    }

                    await prisma.user.update({
                        where: { id: user.id },
                        data: { handle: finalHandle }
                    });
                }
            } catch (error) {
                console.error("[Auth Event] Error in createUser event:", error);
            }
        },
        async linkAccount({ user }) {
            console.log("[Auth Event] Account linked for user:", user.email);
        }
    }
})

const { handlers: rawHandlers, signIn: rawSignIn, signOut: rawSignOut, auth: rawAuth } = nextAuth;
export const handlers = rawHandlers as any;
export const signIn = rawSignIn as any;
export const signOut = rawSignOut as any;

export async function auth(): Promise<Session | null> {
    const session = await (nextAuth.auth as any)()
    if (session?.user?.id) return session

    // Fallback for mobile clients using Authorization: Bearer <accessToken>
    // Works when route handlers call auth() without relying on NextAuth cookies.
    let authorizationHeader: string | null = null
    try {
        authorizationHeader = (await headers()).get("authorization")
    } catch {
        // no-op: headers() not available in this runtime context
    }

    const bearer = extractBearerToken(authorizationHeader)
    if (!bearer) return session

    try {
        const payload = await verifyMobileAccessToken(bearer)
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, email: true, role: true, status: true, deletedAt: true, sessionVersion: true }
        })

        if (!user || user.deletedAt || user.status !== "ACTIVE") return null
        if ((user.sessionVersion ?? 1) !== (payload.tokenVersion ?? 1)) return null

        return {
            user: {
                id: user.id,
                email: user.email ?? payload.email ?? undefined,
                name: undefined,
                role: user.role,
            } as any,
            expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        } as any
    } catch {
        return session
    }
}
