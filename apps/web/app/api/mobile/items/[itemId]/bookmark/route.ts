import { NextResponse } from "next/server";
import { getMobileUser } from "@/lib/auth/mobile-jwt";
import { auth } from "@/auth";
import { mergeUserSettings } from "@/lib/user-settings";

async function resolveUserId(req: Request): Promise<string | null> {
    const mobileUser = await getMobileUser(req);
    if (mobileUser?.id) return mobileUser.id;
    const session = await auth();
    return session?.user?.id || null;
}

export async function POST(req: Request, { params }: { params: Promise<{ itemId: string }> }) {
    try {
        const userId = await resolveUserId(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { itemId } = await params;
        const updated = await mergeUserSettings(userId, (curr) => {
            const existing = Array.isArray(curr.bookmarkedItemIds) ? curr.bookmarkedItemIds : [];
            if (existing.includes(itemId)) return curr;
            return { ...curr, bookmarkedItemIds: [...existing, itemId] };
        });

        return NextResponse.json({ bookmarked: true, bookmarkedItemIds: updated.bookmarkedItemIds });
    } catch (error) {
        console.error("[BOOKMARK_POST]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ itemId: string }> }) {
    try {
        const userId = await resolveUserId(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { itemId } = await params;
        const updated = await mergeUserSettings(userId, (curr) => {
            const existing = Array.isArray(curr.bookmarkedItemIds) ? curr.bookmarkedItemIds : [];
            return { ...curr, bookmarkedItemIds: existing.filter((id) => id !== itemId) };
        });

        return NextResponse.json({ bookmarked: false, bookmarkedItemIds: updated.bookmarkedItemIds });
    } catch (error) {
        console.error("[BOOKMARK_DELETE]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
