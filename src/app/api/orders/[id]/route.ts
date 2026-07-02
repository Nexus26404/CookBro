import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function parseOrder(o: Record<string, unknown>) {
  return {
    ...o,
    meals: JSON.parse(o.meals as string),
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(parseOrder(order as unknown as Record<string, unknown>));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}
