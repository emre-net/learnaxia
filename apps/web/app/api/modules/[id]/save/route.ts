import { auth } from "@/auth";
import { getMobileUser } from "@/lib/auth/mobile-jwt";
import { LibraryService } from "@/domains/module/library.service";
import { ModuleService } from "@/domains/module/module.service";
import { NextResponse } from "next/server";

async function resolveUserId(req: Request): Promise<string | null> {
    const mobileUser = await getMobileUser(req);
    if (mobileUser?.id) return mobileUser.id;
    const session = await auth();
    return session?.user?.id || null;
}

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const userId = await resolveUserId(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: moduleId } = await props.params;
        await ModuleService.addToLibrary(userId, moduleId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Save Module to Library Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const userId = await resolveUserId(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: moduleId } = await props.params;
        await LibraryService.removeFromLibrary(userId, moduleId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Remove Module from Library Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
