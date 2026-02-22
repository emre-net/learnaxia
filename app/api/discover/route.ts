
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await auth();
        // Allow public access? For now, let's require auth as it's in dashboard
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const category = searchParams.get("category");
        const subCategory = searchParams.get("subCategory");
        const type = searchParams.get("type") || "MODULE"; // MODULE | COLLECTION
        const moduleType = searchParams.get("moduleType"); // FLASHCARD, MC, GAP, TRUE_FALSE
        const search = searchParams.get("search");
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = parseInt(searchParams.get("offset") || "0");

        if (type === "COLLECTION") {
            const where = {
                isPublic: true,
                ...(category && { category }),
                ...(subCategory && { subCategory }),
                ...(search && {
                    OR: [
                        { title: { contains: search, mode: "insensitive" } },
                        { description: { contains: search, mode: "insensitive" } }
                    ]
                })
            };

            const [collections, total] = await Promise.all([
                prisma.collection.findMany({
                    where: where as any,
                    include: {
                        owner: { select: { handle: true, image: true, id: true } },
                        _count: { select: { items: true, userLibrary: true } },
                        userLibrary: {
                            where: { userId: session.user.id },
                            select: { userId: true }
                        }
                    },
                    take: limit,
                    skip: offset,
                    orderBy: { createdAt: "desc" }
                }),
                prisma.collection.count({ where: where as any })
            ]);

            const normalizedCollections = collections.map(c => ({
                ...c,
                isInLibrary: c.userLibrary.length > 0,
                userLibrary: undefined // Clean up
            }));

            return NextResponse.json({ items: normalizedCollections, total, type: "COLLECTION" });
        } else {
            // MODULES
            const where = {
                isForkable: true,
                status: "ACTIVE",
                ...(moduleType && { type: moduleType as any }),
                ...(category && { category }),
                ...(subCategory && { subCategory }),
                ...(search && {
                    OR: [
                        { title: { contains: search, mode: "insensitive" } },
                        { description: { contains: search, mode: "insensitive" } }
                    ]
                })
            };

            const [modules, total] = await Promise.all([
                prisma.module.findMany({
                    where: where as any,
                    include: {
                        owner: { select: { handle: true, image: true, id: true } },
                        _count: { select: { items: true, userLibrary: true, forks: true, sessions: true } },
                        userLibrary: {
                            where: { userId: session.user.id },
                            select: { userId: true }
                        }
                    },
                    take: limit,
                    skip: offset,
                    orderBy: { createdAt: "desc" }
                }),
                prisma.module.count({ where: where as any })
            ]);

            const normalizedModules = modules.map(m => ({
                ...m,
                isInLibrary: m.userLibrary.length > 0,
                userLibrary: undefined
            }));

            return NextResponse.json({ items: normalizedModules, total, type: "MODULE" });
        }

    } catch (error) {
        console.error("Discover API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
