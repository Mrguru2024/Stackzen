import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';

const updateClientSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    email: z.string().email().max(320).optional().nullable(),
    phone: z.string().max(50).optional().nullable(),
    address: z.string().max(500).optional().nullable(),
  })
  .strict();

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const { id } = await context.params;

  try {
    const client = await prisma.client.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!client) {
      // 403 rather than 404 to avoid disclosing whether the resource exists for another tenant
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(client);
  } catch (error) {
    console.error('[CLIENT_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const { id } = await context.params;

  try {
    const parsed = updateClientSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const owned = await prisma.client.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const client = await prisma.client.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error('[CLIENT_UPDATE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const { id } = await context.params;

  try {
    const owned = await prisma.client.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.client.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[CLIENT_DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
