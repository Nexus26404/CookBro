import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function parseRecipe(r: Record<string, unknown>) {
  return {
    ...r,
    tags: JSON.parse(r.tags as string),
    ingredients: JSON.parse(r.ingredients as string),
    utensils: JSON.parse(r.utensils as string),
    steps: JSON.parse(r.steps as string),
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recipe = await prisma.recipe.findUnique({
      where: { id },
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    return NextResponse.json(parseRecipe(recipe as unknown as Record<string, unknown>));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch recipe' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const uid = req.headers.get('x-user-uid');
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    // Check ownership
    const existing = await prisma.recipe.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }
    if (existing.createdBy !== uid && existing.createdBy !== 'system') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const recipe = await prisma.recipe.update({
      where: { id },
      data: {
        name: body.name,
        icon: body.icon ?? null,
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
        groupId: body.groupId ?? null,
      },
    });

    return NextResponse.json(parseRecipe(recipe as unknown as Record<string, unknown>));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update recipe' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const uid = req.headers.get('x-user-uid');
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await prisma.recipe.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }
    if (existing.createdBy !== uid && existing.createdBy !== 'system') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.recipe.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete recipe' }, { status: 500 });
  }
}
