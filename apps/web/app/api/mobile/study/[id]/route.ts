import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMobileUser } from '@/lib/auth/mobile-jwt';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getMobileUser(req);

        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id: moduleId } = await params;

        const module = await prisma.module.findUnique({
            where: { id: moduleId },
            include: {
                items: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!module) {
            return NextResponse.json({ message: 'Module not found' }, { status: 404 });
        }

        return NextResponse.json({ module });
    } catch (error) {
        console.error('Mobile Study Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
