import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
    try {
        const session = await auth();
        const cookieStore = await cookies();
        const allCookies = cookieStore.getAll().map(c => `${c.name}=${c.value.substring(0, 10)}...`);
        return NextResponse.json({ session, cookies: allCookies });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
