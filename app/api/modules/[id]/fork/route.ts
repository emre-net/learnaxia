
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

        const sourceModuleId = params.id;
        const newModule = await ModuleService.fork(session.user.id, sourceModuleId);

        return NextResponse.json(newModule, { status: 201 });
    } catch (error) {
        console.error("Fork Module Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
