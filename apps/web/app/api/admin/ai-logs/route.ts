import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const isAdmin =
            session.user.role === "ADMIN" ||
            session.user.email === process.env.ADMIN_EMAIL;

        if (!isAdmin) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const url = new URL(req.url);
        const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10) || 20));
        const q = (url.searchParams.get("q") || "").trim();
        const level = (url.searchParams.get("level") || "").trim().toUpperCase();
        const skip = (page - 1) * limit;

        const where: any = { service: "ai" };
        if (level && level !== "ALL") {
            where.level = level;
        }
        if (q) {
            where.OR = [
                { message: { contains: q, mode: "insensitive" } },
                { requestId: { contains: q, mode: "insensitive" } },
            ];
        }

        const [logs, total] = await Promise.all([
            prisma.systemLog.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.systemLog.count({ where }),
        ]);

        return NextResponse.json({
            logs,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        });
    } catch (error) {
        console.error("[ADMIN_AI_LOGS_GET]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
