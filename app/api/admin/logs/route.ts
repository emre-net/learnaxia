import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();

        // Yetki Kontrolü
        if (!session?.user || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const level = searchParams.get("level");
        const env = searchParams.get("env");
        const service = searchParams.get("service");
        const search = searchParams.get("search");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");

        const skip = (page - 1) * limit;

        const where: any = {};
        if (level) where.level = level;
        if (env) where.environment = env;
        if (service) where.service = service;
        if (search) {
            where.OR = [
                { message: { contains: search, mode: 'insensitive' } },
                { stack: { contains: search, mode: 'insensitive' } },
                { requestId: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [logs, total] = await Promise.all([
            prisma.systemLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.systemLog.count({ where })
        ]);

        return NextResponse.json({
            logs,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        console.error("Failed to fetch logs", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
