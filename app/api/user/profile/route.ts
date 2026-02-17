import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const profileSchema = z.object({
    name: z.string().min(2, "İsim en az 2 karakter olmalıdır.").optional(),
    handle: z.string()
        .min(3, "Kullanıcı adı en az 3 karakter olmalıdır.")
        .max(20, "Kullanıcı adı en fazla 20 karakter olabilir.")
        .regex(/^[a-zA-Z0-9_]+$/, "Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir.")
        .optional(),
});

export async function PATCH(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, handle } = profileSchema.parse(body);

        // Check handle uniqueness if provided
        if (handle) {
            const existingUser = await prisma.user.findUnique({
                where: { handle },
            });

            if (existingUser && existingUser.id !== session.user.id) {
                return new NextResponse("Bu kullanıcı adı zaten alınmış.", { status: 409 });
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                ...(name && { name }),
                ...(handle && { handle }),
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse((error as z.ZodError).errors[0].message, { status: 400 });
        }
        console.error("[PROFILE_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
