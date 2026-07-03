import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function parseRecipe(r: Record<string, unknown>) {
  return {
    ...r,
    tags: JSON.parse(r.tags as string),
    images: JSON.parse((r.images as string) || '[]'),
    ingredients: JSON.parse(r.ingredients as string),
    utensils: JSON.parse(r.utensils as string),
    steps: JSON.parse(r.steps as string),
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');

    const recipes = await prisma.recipe.findMany({
      where: groupId ? { groupId } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(recipes.map(parseRecipe));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const uid = req.headers.get('x-user-uid');
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    const recipe = await prisma.recipe.create({
      data: {
        name: body.name,
        icon: body.icon ?? null,
        images: JSON.stringify(body.images ?? []),
        description: body.description ?? null,
        category: body.category,
        tags: JSON.stringify(body.tags ?? []),
        difficulty: body.difficulty ?? 'easy',
        servings: body.servings ?? 2,
        prepTime: body.prepTime ?? 0,
        cookTime: body.cookTime ?? 0,
        ingredients: JSON.stringify(body.ingredients ?? []),
        utensils: JSON.stringify(body.utensils ?? []),
        steps: JSON.stringify(body.steps ?? []),
        createdBy: uid,
        groupId: body.groupId ?? null,
      },
    });

    return NextResponse.json(parseRecipe(recipe as unknown as Record<string, unknown>), { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 });
  }
}
