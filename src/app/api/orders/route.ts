import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function parseOrder(o: Record<string, unknown>) {
  return {
    ...o,
    meals: JSON.parse(o.meals as string),
  };
}

/** GET /api/orders?groupId=xxx */
export async function GET(req: NextRequest) {
  try {
    const groupId = req.nextUrl.searchParams.get('groupId');
    if (!groupId) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
    }

    const orders = await prisma.order.findMany({
      where: { groupId },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(orders.map(o => parseOrder(o as unknown as Record<string, unknown>)));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
