import { NextResponse } from "next/server";
import { z } from "zod";
import { sendContactEmail } from "@/lib/mail";

const contactSchema = z.object({
    name: z.string().min(1, "İsim gereklidir.").max(100),
    email: z.string().email("Geçerli bir e-posta adresi giriniz."),
    message: z.string().min(5, "Mesaj en az 5 karakter olmalıdır.").max(2000),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validated = contactSchema.parse(body);

        await sendContactEmail(validated.name, validated.email, validated.message);

        return NextResponse.json({ success: true, message: "Mesajınız iletildi." });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0]?.message || "Geçersiz form verisi" }, { status: 400 });
        }
        console.error("[ContactAPI] Error handling contact submission:", error);
        return NextResponse.json({ error: "Mesaj iletilirken bir hata oluştu." }, { status: 500 });
    }
}
