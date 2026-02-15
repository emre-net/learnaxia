
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/utils"; // Assuming utils has slugify or I'll implement a simple one

const RegisterSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password, name } = RegisterSchema.parse(body);

        // 1. Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "User with this email already exists" },
                { status: 409 }
            );
        }

        // 2. Generate unique handle (username)
        let handle = slugify(name);
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 10) {
            const existingHandle = await prisma.user.findUnique({
                where: { handle },
            });

            if (!existingHandle) {
                isUnique = true;
            } else {
                // Append random 4-digit number
                const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                handle = `${slugify(name)}-${randomSuffix}`;
                attempts++;
            }
        }

        if (!isUnique) {
            // Fallback to timestamp if random suffix fails 10 times (highly unlikely)
            handle = `${slugify(name)}-${Date.now()}`;
        }

        // 3. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Create User
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                handle,
                image: `https://api.dicebear.com/7.x/initials/svg?seed=${handle}`, // Default avatar
            },
        });

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json(userWithoutPassword, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 });
        }
        console.error("Registration Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
