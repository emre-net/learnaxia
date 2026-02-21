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
    debug: true, // Hata ayıklama için geçici olarak true
    ...authConfig,
    providers: [
        ...authConfig.providers,
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;

                    // 1. Check Virtual Admin (Override)
                    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
                        console.error("[Auth] ADMIN_EMAIL or ADMIN_PASSWORD is NOT set in environment variables!");
                    }

                    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
                        console.log("[Auth] Virtual Admin login successful");
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
        async signIn({ user }) {
            try {
                // Only generate handle if it doesn't exist (e.g. first time Google login)
                if (user.id && !(user as any).handle && user.email) {
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
                console.error("[Auth Event] Error in signIn event:", error);
                // Don't throw to avoid blocking login even if handle generation fails
            }
        }
    }
})
