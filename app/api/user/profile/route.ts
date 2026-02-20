import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const profileSchema = z.object({
    name: z.string().min(1, "İsim boş olamaz.").max(50, "İsim çok uzun.").optional(),
    handle: z.string()
        .min(3, "Kullanıcı adı en az 3 karakter olmalıdır.")
        .max(20, "Kullanıcı adı en fazla 20 karakter olabilir.")
        .regex(/^[a-zA-Z0-9_]+$/, "Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir.")
        .optional(),
    image: z.string().url("Geçersiz profil resmi URL'si.").optional().or(z.literal("")),
    language: z.enum(["tr", "en"]).optional(),
});

export async function GET(req: Request) {
    try {
        const session = await auth();
        // Allow fetching other users' profiles via query param in future, 
        // for now just current user or simple check
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId") || session?.user?.id;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                handle: true,
                image: true,
                createdAt: true,
                // Add Bio if it exists in schema, otherwise just these
                _count: {
                    select: {
                        createdModules: true,
                        collections: true,
                    }
                }
            }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Calculate simple stats
        // In a real app, we might aggregate forks/likes here
        const stats = {
            modules: user._count.createdModules,
            collections: user._count.collections,
        };

        return NextResponse.json({ ...user, stats });

    } catch (error) {
        console.error("[PROFILE_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { handle, name, image, language } = profileSchema.parse(body);

        // Check handle uniqueness if provided
        if (handle) {
            const existingUser = await prisma.user.findUnique({
                where: { handle },
            });

            if (existingUser && existingUser.id !== session.user.id) {
                return new NextResponse("Bu kullanıcı adı zaten alınmış.", { status: 409 });
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                ...(handle && { handle }),
                ...(name && { name }),
                ...(image !== undefined && { image }),
                ...(language && { language }),
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        if (error instanceof z.ZodError) {
            // Explicitly cast to any to avoid TS build errors with ZodError types
            return new NextResponse((error as any).errors[0].message, { status: 400 });
        }
        console.error("[PROFILE_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
