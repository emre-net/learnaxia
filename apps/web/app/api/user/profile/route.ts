import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { ProfileUpdateSchema } from "@learnaxia/shared";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                handle: true,
                image: true,
                language: true,
                role: true,
                createdAt: true,
                settings: true,
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

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        const stats = {
            modules: user._count.createdModules,
            collections: user._count.collections,
            notes: user._count.notes,
            journeys: user._count.learningJourneys,
            solvedQuestions: user._count.solvedQuestions,
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
        const { name, handle, image, language } = ProfileUpdateSchema.parse(body);

        // Check handle uniqueness if provided (case-insensitive normalization)
        const normalizedHandle = handle ? handle.trim().toLowerCase() : undefined;
        if (normalizedHandle) {
            const existingUser = await prisma.user.findUnique({
                where: { handle: normalizedHandle },
            });

            if (existingUser && existingUser.id !== session.user.id) {
                return new NextResponse("Bu kullanıcı adı zaten alınmış.", { status: 409 });
            }
        }

        const trimmedName = typeof name === "string" ? name.trim() : name;

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                ...(name !== undefined && { name: trimmedName ? trimmedName : null }),
                ...(normalizedHandle && { handle: normalizedHandle }),
                ...(image !== undefined && { image: image === "" ? null : image }),
                ...(language && { language }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                handle: true,
                image: true,
                language: true,
                role: true,
            }
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(error.issues[0]?.message || "Geçersiz veri", { status: 400 });
        }
        console.error("[PROFILE_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
