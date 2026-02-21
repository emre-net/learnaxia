import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import prisma from "@/lib/prisma"
import { authConfig } from "./auth.config"
import { z } from "zod"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    debug: true,
    trustHost: true,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role || 'USER';
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                (session.user as any).role = token.role;
            }
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            const isOnAdmin = nextUrl.pathname.startsWith('/admin');

            if (isOnAdmin) {
                if (isLoggedIn) {
                    const userRole = (auth.user as any)?.role;
                    if (userRole === "ADMIN") return true;
                    return Response.redirect(new URL('/dashboard', nextUrl));
                }
                return false;
            }

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false;
            } else if (isLoggedIn) {
                if (nextUrl.pathname === '/login') {
                    return Response.redirect(new URL('/dashboard', nextUrl));
                }
            }
            return true;
        },
    },
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
        }),
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;

                    // 1. Check Virtual Admin (Override)
                    // if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
                    //     console.error("[Auth] ADMIN_EMAIL or ADMIN_PASSWORD is NOT set in environment variables!");
                    // }

                    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
                        // console.log("[Auth] Virtual Admin login successful");
                        return {
                            id: "virtual-admin",
                            email: email,
                            name: "Virtual Admin",
                            role: "ADMIN"
                        } as any;
                    }

                    // 2. Database User
                    const user = await prisma.user.findUnique({ where: { email } });
                    if (!user || !user.password) return null;

                    // Block login if email is not verified
                    if (!user.emailVerified) return null;

                    const passwordsMatch = await bcrypt.compare(password, user.password);
                    if (passwordsMatch) return user;
                }
                return null;
            },
        }),
    ],
    events: {
        async createUser({ user }) {
            try {
                // Generate handle ONLY for new users (Oauth/Adapter created)
                if (user.id && user.email) {
                    const emailPrefix = user.email.split('@')[0];
                    const baseHandle = emailPrefix.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                    let handle = baseHandle || `user${Math.floor(Math.random() * 10000)}`;

                    // Robust uniqueness check
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
