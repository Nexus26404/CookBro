import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const uid = req.headers.get('x-user-uid');
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { targetUid } = await req.json();
    if (!targetUid) return NextResponse.json({ error: 'targetUid is required' }, { status: 400 });

    // Find the group the creator belongs to
    const creator = await prisma.user.findUnique({ where: { uid } });
    if (!creator || !creator.groupId) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const group = await prisma.group.findUnique({ where: { id: creator.groupId } });
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Verify requester is the creator of the group
    if (group.createdBy !== uid) {
      return NextResponse.json({ error: 'Forbidden: Only the creator can remove members' }, { status: 403 });
    }

    const members: string[] = JSON.parse(group.members);
    if (!members.includes(targetUid)) {
      return NextResponse.json({ error: 'User is not a member of this group' }, { status: 400 });
    }

    // Remove member
    const updatedMembers = members.filter((m) => m !== targetUid);
    await prisma.group.update({
      where: { id: group.id },
      data: { members: JSON.stringify(updatedMembers) },
    });

    // Unlink the user
    await prisma.user.update({
      where: { uid: targetUid },
      data: { groupId: null },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
