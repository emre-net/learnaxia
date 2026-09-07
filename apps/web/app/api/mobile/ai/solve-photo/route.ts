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

        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ message: 'File is too large (max 10MB)' }, { status: 413 });
        }

        // Rate Limiting: Max 5 requests per minute
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        const recentRequests = await prisma.solvedQuestion.count({
            where: {
                userId: user.id,
                createdAt: { gte: oneMinuteAgo }
            }
        });

        if (recentRequests >= 5) {
            return NextResponse.json({ message: 'Rate limit exceeded. Try again later.' }, { status: 429 });
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
            // Kullanıcıya gösterilecek güvenli mesajlar — raw AI hatası sankılandır
            const safeMessages: Record<string, string> = {
                'VISION_FAILED': 'Görüntü analiz edilemedi. Lütfen net bir fotoğraf yükleyin.',
                'AUTH_ERROR': 'AI servisine erişilemedi. Lütfen tekrar deneyin.',
                'RATE_LIMIT': 'Fazla istek gönderildi. Lütfen bir süre bekleyin.',
                'UNKNOWN': 'Soru çözülemedi. Lütfen tekrar deneyin.',
            };
            const safeMessage = safeMessages[error.code] ?? safeMessages['UNKNOWN'];
            return NextResponse.json({ message: safeMessage, code: error.code }, { status: 422 });
        }
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
