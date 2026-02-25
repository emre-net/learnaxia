
export const dynamic = 'force-dynamic';

import { auth } from "@/auth";
import { AIService } from "@/domains/ai/ai.service";
import { AIError } from "@/domains/ai/ai.interface";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "Lütfen bir dosya yükleyin." }, { status: 400 });
        }

        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "Yalnızca resim dosyaları desteklenmektedir." }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const result = await AIService.solvePhoto(buffer, file.type);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Solve Photo API Error:", error);

        if (error instanceof AIError) {
            return NextResponse.json({
                error: error.message,
                code: error.code
            }, { status: 422 });
        }

        return NextResponse.json({
            error: "Soru çözülürken bir hata oluştu. Lütfen tekrar deneyin."
        }, { status: 500 });
    }
}
