import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function todayString() {
  return new Date().toISOString().split('T')[0];
}

function parseOrder(o: Record<string, unknown>) {
  return { ...o, meals: JSON.parse(o.meals as string) };
}

/** GET /api/orders/today?groupId=xxx */
export async function GET(req: NextRequest) {
  try {
    const groupId = req.nextUrl.searchParams.get('groupId');
    if (!groupId) return NextResponse.json(null);

    const order = await prisma.order.findUnique({
      where: { groupId_date: { groupId, date: todayString() } },
    });

    return NextResponse.json(order ? parseOrder(order as unknown as Record<string, unknown>) : null);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

/** POST /api/orders/today — upsert today's order for a meal type */
export async function POST(req: NextRequest) {
  try {
    const uid = req.headers.get('x-user-uid');
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { groupId, mealType, recipeIds } = await req.json();
    if (!groupId || !mealType) {
      return NextResponse.json({ error: 'groupId and mealType required' }, { status: 400 });
    }

    const today = todayString();
    const orderId = `${groupId}_${today}`;

    const existing = await prisma.order.findUnique({
      where: { groupId_date: { groupId, date: today } },
    });

    let meals: { type: string; recipes: string[]; orderedBy: string }[] = [];
    if (existing) {
      meals = (JSON.parse(existing.meals) as typeof meals).filter((m) => m.type !== mealType);
    }
    meals.push({ type: mealType, recipes: recipeIds, orderedBy: uid });

    const order = await prisma.order.upsert({
      where: { groupId_date: { groupId, date: today } },
      create: { id: orderId, groupId, date: today, meals: JSON.stringify(meals), status: 'confirmed' },
      update: { meals: JSON.stringify(meals), status: 'confirmed' },
    });

    return NextResponse.json(parseOrder(order as unknown as Record<string, unknown>));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to confirm order' }, { status: 500 });
  }
}
