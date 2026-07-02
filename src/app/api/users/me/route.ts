import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** POST /api/users/me — upsert user profile after Firebase login */
export async function POST(req: NextRequest) {
  try {
    const { uid, displayName, email, photoURL } = await req.json();
    if (!uid || !email) {
      return NextResponse.json({ error: 'uid and email required' }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { uid },
      create: { uid, displayName: displayName || '用户', email, photoURL: photoURL ?? null },
      update: { displayName: displayName || '用户', email, photoURL: photoURL ?? null },
    });

    return NextResponse.json(user);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to upsert user' }, { status: 500 });
  }
}
