import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { isAdminUser } from "@/lib/auth/is-admin";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!isAdminUser({ role: (session.user as any).role, email: session.user.email })) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const level = searchParams.get("level");
        const env = searchParams.get("env");
        const service = searchParams.get("service");
        const search = searchParams.get("search");
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50));

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
