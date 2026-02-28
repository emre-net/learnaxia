
import { auth } from "@/auth";
import { ModuleService } from "@/domains/module/module.service";
import { NextResponse } from "next/server";

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: moduleId } = await props.params;
        await ModuleService.addToLibrary(session.user.id, moduleId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Save Module to Library Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
