// Final deployment trigger - stable build v1.0.1
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse, NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req: NextRequest) => {
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
    matcher: ["/((?!api/server-health|api/ping|static|.*\\..*|_next).*)"],
};
