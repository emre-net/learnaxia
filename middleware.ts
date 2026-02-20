import { auth } from "./auth";

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const { nextUrl } = req;
    const isAdminRoute = nextUrl.pathname.startsWith("/admin");

    if (isAdminRoute) {
        if (!isLoggedIn) {
            return Response.redirect(new URL("/auth/login", nextUrl));
        }

        const userRole = (req.auth?.user as any)?.role;
        if (userRole !== "ADMIN") {
            return Response.redirect(new URL("/dashboard", nextUrl));
        }
    }
});

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
