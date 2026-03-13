import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const requestId = crypto.randomUUID();

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-request-id", requestId);

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    response.headers.set("x-request-id", requestId);

    return response;
}) as any;

export const config = {
    matcher: ["/dashboard/:path*", "/admin", "/admin/:path*", "/login", "/api/:path*"],
};
