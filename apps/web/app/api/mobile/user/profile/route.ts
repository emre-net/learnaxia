import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getMobileUser } from "@/lib/auth/mobile-jwt";
import { z } from "zod";

const mobileProfileUpdateSchema = z.object({
    name: z.string().min(1, "Ad Soyad en az 1 karakter olmalıdır.").max(60, "Ad Soyad en fazla 60 karakter olabilir.").optional(),
    handle: z.string()
        .min(3, "Kullanıcı adı en az 3 karakter olmalıdır.")
        .max(20, "Kullanıcı adı en fazla 20 karakter olabilir.")
        .regex(/^[a-zA-Z0-9_-]+$/, "Kullanıcı adı sadece harf, rakam, tire ve alt çizgi içerebilir.")
        .optional(),
    image: z.string().url("Geçersiz profil resmi URL'si.").optional().or(z.literal("")).or(z.null()),
    language: z.enum(["tr", "en"]).optional(),
});

export async function GET(req: Request) {
    try {
        const user = await getMobileUser(req);

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const userData = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                name: true,
                email: true,
                handle: true,
                image: true,
                createdAt: true,
                _count: {
                    select: {
                        createdModules: true,
                        collections: true,
                        notes: true,
                        learningJourneys: true,
                        solvedQuestions: true,
                    }
                }
            }
        });

        if (!userData) {
            return new NextResponse("User not found", { status: 404 });
        }

        const stats = {
            modules: userData._count.createdModules,
            collections: userData._count.collections,
            notes: userData._count.notes,
            journeys: userData._count.learningJourneys,
            solvedQuestions: userData._count.solvedQuestions,
        };

        return NextResponse.json({ ...userData, stats });

    } catch (error) {
        console.error("[MOBILE_PROFILE_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const user = await getMobileUser(req);

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const parsed = mobileProfileUpdateSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0]?.message || "Geçersiz veri" }, { status: 400 });
        }

        const { name, handle, image, language } = parsed.data;

        // Check handle uniqueness if provided and changed
        if (handle) {
            const existingUser = await prisma.user.findUnique({
                where: { handle },
            });

            if (existingUser && existingUser.id !== user.id) {
                return NextResponse.json({ error: "Bu kullanıcı adı zaten alınmış." }, { status: 409 });
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                ...(name !== undefined && { name: name.trim() }),
                ...(handle !== undefined && { handle: handle.trim().toLowerCase() }),
                ...(image !== undefined && { image: image === "" ? null : image }),
                ...(language && { language }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                handle: true,
                image: true,
                createdAt: true,
                _count: {
                    select: {
                        createdModules: true,
                        collections: true,
                        notes: true,
                        learningJourneys: true,
                        solvedQuestions: true,
                    }
                }
            }
        });

        const stats = {
            modules: updatedUser._count.createdModules,
            collections: updatedUser._count.collections,
            notes: updatedUser._count.notes,
            journeys: updatedUser._count.learningJourneys,
            solvedQuestions: updatedUser._count.solvedQuestions,
        };

        return NextResponse.json({ ...updatedUser, stats });

    } catch (error) {
        console.error("[MOBILE_PROFILE_PATCH]", error);
        return NextResponse.json({ error: "Profil güncellenemedi" }, { status: 500 });
    }
}
