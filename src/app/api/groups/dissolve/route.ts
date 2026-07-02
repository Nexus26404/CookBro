import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const uid = req.headers.get('x-user-uid');
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Find the group the creator belongs to
    const creator = await prisma.user.findUnique({ where: { uid } });
    if (!creator || !creator.groupId) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const group = await prisma.group.findUnique({ where: { id: creator.groupId } });
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Verify requester is the creator
    if (group.createdBy !== uid) {
      return NextResponse.json({ error: 'Forbidden: Only the creator can dissolve the group' }, { status: 403 });
    }

    const members: string[] = JSON.parse(group.members);

    // Unlink all members
    await prisma.user.updateMany({
      where: { uid: { in: members } },
      data: { groupId: null },
    });

    // Delete the group
    await prisma.group.delete({
      where: { id: group.id },
    });

    // Optional: Delete orders for this group too
    await prisma.order.deleteMany({
      where: { groupId: group.id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to dissolve group' }, { status: 500 });
  }
}
