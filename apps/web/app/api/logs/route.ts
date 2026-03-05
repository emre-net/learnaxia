import { NextRequest, NextResponse } from "next/server";
import { LoggingService } from "@/domains/logging/logging.service";
import { auth } from "@/auth";

// Basit Rate Limiting: IP başına son 1 dakikadaki log sayısı
const ipCache = new Map<string, { count: number; lastReset: number }>();
const MAX_LOGS_PER_MINUTE = 20;

// Duplicate Detection: Aynı mesaj + url + stack için son 1 dakadaki engelleme
const duplicateCache = new Map<string, number>();

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for") || "anonymous";
        const now = Date.now();

        // 1. Rate Limiting Kontrolü
        const ipData = ipCache.get(ip) || { count: 0, lastReset: now };
        if (now - ipData.lastReset > 60000) {
            ipData.count = 0;
            ipData.lastReset = now;
        }
        ipData.count++;
        ipCache.set(ip, ipData);

        if (ipData.count > MAX_LOGS_PER_MINUTE) {
            return NextResponse.json({ error: "Too many logs" }, { status: 429 });
        }

        const body = await req.json();
        const { level, message, stack, url, metadata } = body;

        // 2. Duplicate Detection
        const duplicateKey = `${level}:${message}:${url || ""}`;
        const lastSeen = duplicateCache.get(duplicateKey);
        if (lastSeen && now - lastSeen < 60000) {
            return NextResponse.json({ status: "ignored_duplicate" });
        }
        duplicateCache.set(duplicateKey, now);

        // 3. Kullanıcı Bilgisi
        const session = await auth();
        const userId = session?.user?.id;
        const requestId = req.headers.get("x-request-id") || undefined;

        // 4. Loglama
        await LoggingService.logClient({
            level,
            message,
            stack,
            url,
            userAgent: req.headers.get("user-agent") || undefined,
            ipAddress: ip,
            metadata: {
                ...metadata,
                requestId
            },
            userId
        });

        return NextResponse.json({ status: "success" });
    } catch (error) {
        console.error("Critical failure in /api/logs route", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
