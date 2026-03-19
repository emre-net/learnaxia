import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { MobileRegisterSchema } from '@/lib/validations/mobile-auth';
import { SignJWT } from 'jose';

const secret = process.env.MOBILE_JWT_SECRET || process.env.AUTH_SECRET;
const JWT_SECRET = new TextEncoder().encode(secret || 'fallback_secret_for_development');

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const validatedData = MobileRegisterSchema.safeParse(json);

    if (!validatedData.success) {
      return NextResponse.json({ 
        message: 'Validation error', 
        errors: validatedData.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { name, email, password } = validatedData.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(JWT_SECRET);

    const refreshToken = await new SignJWT({ id: user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('90d')
      .sign(JWT_SECRET);

    return NextResponse.json({
      accessToken: token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Mobile Register Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
