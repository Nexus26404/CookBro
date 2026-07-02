import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function parseGroup(g: Record<string, unknown>) {
  return { ...g, members: JSON.parse(g.members as string) };
}

/** POST /api/groups/join — join a group by invite code */
export async function POST(req: NextRequest) {
  try {
    const uid = req.headers.get('x-user-uid');
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { inviteCode } = await req.json();
    if (!inviteCode) return NextResponse.json({ error: 'inviteCode required' }, { status: 400 });

    const group = await prisma.group.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() },
    });

    if (!group) {
      return NextResponse.json({ error: '邀请码不存在或已过期' }, { status: 404 });
    }

    const members: string[] = JSON.parse(group.members);
    if (members.includes(uid)) {
      return NextResponse.json({ error: '您已经是该家庭的成员了' }, { status: 400 });
    }

    const updatedMembers = [...members, uid];
    const updated = await prisma.group.update({
      where: { id: group.id },
      data: { members: JSON.stringify(updatedMembers) },
    });

    // Link user to group
    await prisma.user.update({ where: { uid }, data: { groupId: group.id } });

    return NextResponse.json(parseGroup(updated as unknown as Record<string, unknown>));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to join group' }, { status: 500 });
  }
}
