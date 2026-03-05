import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default NextAuth(authConfig).auth((req) => {
    const requestId = crypto.randomUUID();

    // Proper way to pass headers to downstream in Next.js Middleware
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-request-id", requestId);

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    response.headers.set("x-request-id", requestId);

    return response;
});

export const config = {
    matcher: ["/dashboard/:path*", "/admin", "/admin/:path*", "/login", "/api/:path*"],
};
