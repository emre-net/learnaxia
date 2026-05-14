import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import prisma from "@/lib/prisma"
import { authConfig } from "./auth.config"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { headers, cookies } from "next/headers"
import { extractBearerToken, verifyMobileAccessToken } from "@/lib/auth/mobile-jwt"
import type { Session } from "next-auth"

const nextAuth = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    session: { strategy: "database" },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
            }
            return token;
        },
        async session({ session, user, token }) {
            if (user && session.user) {
                session.user.id = user.id;
                (session.user as any).role = (user as any).role;
            } else if (token && session.user) {
                session.user.id = token.id as string;
                (session.user as any).role = token.role;
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
    try {
        const session = await (nextAuth.auth as any)()
        if (session?.user?.id) return session
    } catch (e) {
        console.error("[Auth] nextAuth.auth() failed:", e)
    }

    // Workaround for NextAuth v5 server component bug behind Railway proxies
    // Instead of making a fetch request, directly check the database or decode JWT using the session cookie
    try {
        const cookieStore = await cookies();
        let sessionToken = cookieStore.get("authjs.session-token")?.value;
        let salt = "authjs.session-token";
        
        if (!sessionToken) {
            sessionToken = cookieStore.get("__Secure-authjs.session-token")?.value;
            salt = "__Secure-authjs.session-token";
        }
        if (!sessionToken) {
            sessionToken = cookieStore.get("next-auth.session-token")?.value;
            salt = "next-auth.session-token";
        }
        if (!sessionToken) {
            sessionToken = cookieStore.get("__Secure-next-auth.session-token")?.value;
            salt = "__Secure-next-auth.session-token";
        }
        
        if (sessionToken) {
            // First, try decoding as JWT (since NextAuth forces JWT when Credentials provider is used)
            try {
                const { decode } = await import("next-auth/jwt");
                const decoded = await decode({
                    token: sessionToken,
                    salt: salt,
                    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dummy-secret-for-startup-avoiding-crash",
                });
                
                if (decoded && decoded.id) {
                    return {
                        user: {
                            id: decoded.id as string,
                            name: decoded.name as string | undefined,
                            email: decoded.email as string | undefined,
                            image: (decoded.picture || decoded.image) as string | undefined,
                            role: decoded.role as string,
                        },
                        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    } as Session;
                }
            } catch (err) {
                // If decoding fails, it might be a database session token (UUID), proceed to DB lookup
                console.log("[Auth] JWT decode failed, attempting DB lookup");
            }

            // DB fallback
            const dbSession = await prisma.session.findUnique({
                where: { sessionToken },
                include: { user: true }
            });
            if (dbSession?.user && dbSession.expires > new Date()) {
                return {
                    user: { 
                        id: dbSession.user.id, 
                        name: dbSession.user.name, 
                        email: dbSession.user.email, 
                        image: dbSession.user.image,
                        role: (dbSession.user as any).role 
                    },
                    expires: dbSession.expires.toISOString()
                } as Session;
            }
        }
    } catch (e) {
        console.error("[Auth] Direct DB fallback failed:", e)
    }

    // Fallback for mobile clients using Authorization: Bearer <accessToken>
    // Works when route handlers call auth() without relying on NextAuth cookies.
    let authorizationHeader: string | null = null
    try {
        authorizationHeader = (await headers()).get("authorization")
    } catch {
        // no-op: headers() not available in this runtime context
    }

    const bearer = extractBearerToken(authorizationHeader)
    if (!bearer) return null

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
        return null
    }
}
