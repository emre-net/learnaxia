import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default NextAuth(authConfig).auth((req) => {
    const requestId = crypto.randomUUID();
    const response = NextResponse.next();

    // Add requestId to request headers so it can be read in API routes
    req.headers.set("x-request-id", requestId);

    // Also add to response headers for debugging
    response.headers.set("x-request-id", requestId);

    return response;
});

export const config = {
    matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/api/:path*"],
};
