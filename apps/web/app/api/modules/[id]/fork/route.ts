import { auth } from "@/auth";
import { getMobileUser } from "@/lib/auth/mobile-jwt";
import { ModuleService } from "@/domains/module/module.service";
import { NextResponse } from "next/server";

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        let userId: string | undefined;
        const mobileUser = await getMobileUser(req);
        if (mobileUser?.id) {
            userId = mobileUser.id;
        } else {
            const session = await auth();
            if (session?.user?.id) userId = session.user.id;
        }

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: sourceModuleId } = await props.params;
        const newModule = await ModuleService.fork(userId, sourceModuleId);

        return NextResponse.json(newModule, { status: 201 });
    } catch (error) {
        console.error("Fork Module Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
