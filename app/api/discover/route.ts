
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
        const search = searchParams.get("search");
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = parseInt(searchParams.get("offset") || "0");

        if (type === "COLLECTION") {
            const collections = await prisma.collection.findMany({
                where: {
                    // For now, show all collections or filter by public logic if added
                    // Assuming for now, we show all active collections (no explicit status field yet, but we can filter by non-empty or just all)
                    // If we want to show only "Public" collections, we need that field back or logic. 
                    // Let's assume for MVP all collections are "discoverable" or we filter by simple existence.
                    // Wait, Modules have `isForkable` or `status: ACTIVE`. Collections don't have explicit status yet in schema except for `createdAt`.
                    // Let's just filter by Category for now.
                    ...(category && { category }),
                    ...(subCategory && { subCategory }),
                    ...(search && {
                        OR: [
                            { title: { contains: search, mode: "insensitive" } },
                            // { description: { contains: search, mode: "insensitive" } } // Description commented out in migration
                        ]
                    })
                },
                include: {
                    owner: { select: { handle: true, image: true, id: true } },
                    _count: { select: { items: true } }
                },
                take: limit,
                skip: offset,
                orderBy: { createdAt: "desc" }
            });
            return NextResponse.json({ items: collections, type: "COLLECTION" });
        } else {
            // MODULES
            const modules = await prisma.module.findMany({
                where: {
                    isForkable: true, // Only show public/forkable modules
                    status: "ACTIVE",
                    ...(category && { category }),
                    ...(subCategory && { subCategory }),
                    ...(search && {
                        OR: [
                            { title: { contains: search, mode: "insensitive" } },
                            { description: { contains: search, mode: "insensitive" } }
                        ]
                    })
                },
                include: {
                    owner: { select: { handle: true, image: true, id: true } },
                    _count: { select: { items: true } }
                },
                take: limit,
                skip: offset,
                orderBy: { createdAt: "desc" }
            });
            return NextResponse.json({ items: modules, type: "MODULE" });
        }

    } catch (error) {
        console.error("Discover API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
