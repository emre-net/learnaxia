import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMobileUser } from '@/lib/auth/mobile-jwt';
import { AIService } from '@/domains/ai/ai.service';
import { AIError } from '@/domains/ai/ai.interface';

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const user = await getMobileUser(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ message: 'No file provided' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        const language = dbUser?.language || "tr";

        const result = await AIService.solvePhoto(buffer, file.type, language);

        // Optional: Save to SolvedQuestion history
        await prisma.solvedQuestion.create({
            data: {
                userId: user.id,
                imageUrl: "mobile_upload", // In a real app, you'd upload to S3/Cloudinary first
                questionText: result.questionText,
                solution: result.solution
            }
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Mobile Vision API Error:', error);
        if (error instanceof AIError) {
            return NextResponse.json({ message: error.message, code: error.code }, { status: 422 });
        }
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
