import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMobileUser } from '@/lib/auth/mobile-jwt';
import { Prisma } from '@prisma/client';

export async function GET(req: Request) {
    try {
        const user = await getMobileUser(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") || "MODULE";
        const search = searchParams.get("search");
        const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
        const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);

        if (type === "COLLECTION") {
            const where: Prisma.CollectionWhereInput = {
                visibility: 'PUBLIC',
                ...(search && {
                    OR: [
                        { title: { contains: search, mode: 'insensitive' as const } },
                        { description: { contains: search, mode: 'insensitive' as const } }
                    ]
                })
            };

            const [collections, total] = await Promise.all([
                prisma.collection.findMany({
                    where,
                    include: {
                        owner: { select: { handle: true, image: true, id: true, name: true } },
                        _count: { select: { items: true } }
                    },
                    take: limit,
                    skip: offset,
                    orderBy: { createdAt: "desc" }
                }),
                prisma.collection.count({ where })
            ]);

            return NextResponse.json({ items: collections, total, type: "COLLECTION" });
        } else {
            // MODULES (default)
            const where: Prisma.ModuleWhereInput = {
                visibility: 'PUBLIC',
                isForkable: true,
                status: "ACTIVE",
                ...(search && {
                    OR: [
                        { title: { contains: search, mode: 'insensitive' as const } },
                        { description: { contains: search, mode: 'insensitive' as const } }
                    ]
                })
            };

            const [modules, total] = await Promise.all([
                prisma.module.findMany({
                    where,
                    include: {
                        owner: { select: { handle: true, image: true, id: true, name: true } },
                        _count: { select: { items: true } }
                    },
                    take: limit,
                    skip: offset,
                    orderBy: { createdAt: "desc" }
                }),
                prisma.module.count({ where })
            ]);

            return NextResponse.json({ items: modules, total, type: "MODULE" });
        }
    } catch (error) {
        console.error('Mobile Discover Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
