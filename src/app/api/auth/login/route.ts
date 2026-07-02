import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: '用户不存在或尚未配置本地密码' }, { status: 400 });
    }

    // Verify SHA-256 password hash
    const inputHash = crypto.createHash('sha256').update(password).digest('hex');
    if (inputHash !== user.passwordHash) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 400 });
    }

    return NextResponse.json({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
