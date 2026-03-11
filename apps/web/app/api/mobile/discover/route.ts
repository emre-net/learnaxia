import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMobileUser } from '@/lib/auth/mobile-jwt';

export async function GET(req: Request) {
    try {
        const user = await getMobileUser(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") || "MODULE";
        const search = searchParams.get("search");
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = parseInt(searchParams.get("offset") || "0");

        if (type === "COLLECTION") {
            const where = {
                visibility: 'PUBLIC',
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
                        owner: { select: { handle: true, image: true, id: true, name: true } },
                        _count: { select: { items: true } }
                    },
                    take: limit,
                    skip: offset,
                    orderBy: { createdAt: "desc" }
                }),
                prisma.collection.count({ where: where as any })
            ]);

            return NextResponse.json({ items: collections, total, type: "COLLECTION" });
        } else {
            // MODULES (default)
            const where = {
                visibility: 'PUBLIC',
                isForkable: true,
                status: "ACTIVE",
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
                        owner: { select: { handle: true, image: true, id: true, name: true } },
                        _count: { select: { items: true } }
                    },
                    take: limit,
                    skip: offset,
                    orderBy: { createdAt: "desc" }
                }),
                prisma.module.count({ where: where as any })
            ]);

            return NextResponse.json({ items: modules, total, type: "MODULE" });
        }
    } catch (error) {
        console.error('Mobile Discover Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
