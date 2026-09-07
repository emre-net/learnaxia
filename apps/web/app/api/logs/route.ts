import { NextRequest, NextResponse } from "next/server";
import { LoggingService } from "@/domains/logging/logging.service";
import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for") || "anonymous";
        const now = Date.now();

        // M5: DB tabanlı rate limiting — serverless cold start'ta sıfırlanmaz
        // IP başına dakikada 20 log
        const ipLimit = await checkRateLimit({
            key: `client-logs:${ip}`,
            limit: 20,
            windowMs: 60 * 1000
        });

        if (!ipLimit.allowed) {
            return NextResponse.json({ error: "Too many logs" }, { status: 429 });
        }

        const body = await req.json();
        const logs = Array.isArray(body) ? body : [body];

        // Kullanıcı Bilgisi
        const session = await auth();
        const userId = session?.user?.id;
        const requestId = req.headers.get("x-request-id") || undefined;
        const userAgent = req.headers.get("user-agent") || undefined;

        for (const log of logs) {
            const { level, message, stack, url, metadata } = log;

            if (!message || !level) continue;

            // 5. Loglama
            await LoggingService.logClient({
                level,
                message,
                stack,
                url,
                userAgent,
                ipAddress: ip,
                metadata: {
                    ...metadata,
                    requestId
                },
                userId
            });
        }

        return NextResponse.json({ status: "success", count: logs.length });
    } catch (error) {
        console.error("Critical failure in /api/logs route", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
