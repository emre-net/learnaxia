import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getMobileUser } from "@/lib/auth/mobile-jwt";

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
        };

        return NextResponse.json({ ...userData, stats });

    } catch (error) {
        console.error("[MOBILE_PROFILE_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
