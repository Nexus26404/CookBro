import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName } = await req.json();

    if (!email || !password || !displayName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (existing) {
      return NextResponse.json({ error: '该邮箱已被注册' }, { status: 400 });
    }

    // Hash password with SHA-256
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const uid = `local-${crypto.randomUUID()}`;

    const user = await prisma.user.create({
      data: {
        uid,
        email: emailLower,
        displayName: displayName.trim(),
        passwordHash,
      },
    });

    return NextResponse.json({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
