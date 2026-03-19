import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const isAdmin = session.user.role === "ADMIN" ||
            session.user.email === "netemre387@gmail.com" ||
            session.user.email === process.env.ADMIN_EMAIL;

        if (!isAdmin) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            prisma.systemLog.findMany({
                where: { service: "ai" },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.systemLog.count({
                where: { service: "ai" },
            }),
        ]);

        return NextResponse.json({
            logs,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("[ADMIN_AI_LOGS_GET]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
