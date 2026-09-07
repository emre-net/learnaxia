import { NextResponse } from "next/server";

/**
 * Bu endpoint kalıcı olarak devre dışı bırakıldı.
 * Eski debug amacıyla kullanılıyordu — production'da hiçbir zaman açık olmamalı.
 */
export async function GET() {
    return NextResponse.json(
        { error: "Bu endpoint devre dışı bırakıldı." },
        { status: 410 }
    );
}
