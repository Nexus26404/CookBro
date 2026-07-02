import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function parseGroup(g: Record<string, unknown>, memberProfiles: any[] = []) {
  return {
    ...g,
    members: JSON.parse(g.members as string),
    memberProfiles,
  };
}

/** GET /api/groups?uid=xxx — get the user's current group */
export async function GET(req: NextRequest) {
  try {
    const uid = req.nextUrl.searchParams.get('uid');
    if (!uid) return NextResponse.json({ error: 'uid required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { uid } });
    if (!user?.groupId) return NextResponse.json(null);

    const group = await prisma.group.findUnique({ where: { id: user.groupId } });
    if (!group) return NextResponse.json(null);

    const memberUids = JSON.parse(group.members as string) as string[];
    const memberProfiles = await prisma.user.findMany({
      where: { uid: { in: memberUids } },
      select: {
        uid: true,
        displayName: true,
        email: true,
        photoURL: true,
      },
    });

    return NextResponse.json(parseGroup(group as unknown as Record<string, unknown>, memberProfiles));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
  }
}

/** POST /api/groups — create a new group */
export async function POST(req: NextRequest) {
  try {
    const uid = req.headers.get('x-user-uid');
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

    const inviteCode = generateInviteCode();

    const group = await prisma.group.create({
      data: {
        name,
        members: JSON.stringify([uid]),
        inviteCode,
        createdBy: uid,
      },
    });

    // Link user to group
    await prisma.user.update({ where: { uid }, data: { groupId: group.id } });

    return NextResponse.json(parseGroup(group as unknown as Record<string, unknown>), { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}
