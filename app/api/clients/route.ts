import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';

const createClientSchema = z
  .object({
    name: z.string().min(1).max(200),
    email: z.string().email().max(320).optional().nullable(),
    phone: z.string().max(50).optional().nullable(),
    address: z.string().max(500).optional().nullable(),
  })
  .strict();

export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  try {
    const clients = await prisma.client.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(clients);
  } catch (error) {
    console.error('[CLIENTS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  try {
    const parsed = createClientSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: {
        userId: session.user.id,
        name: parsed.data.name,
        email: parsed.data.email ?? null,
        phone: parsed.data.phone ?? null,
        address: parsed.data.address ?? null,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('[CLIENT_CREATE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
