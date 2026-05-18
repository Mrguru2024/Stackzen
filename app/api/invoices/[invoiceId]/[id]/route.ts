import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import type { Invoice } from '@prisma/client';
import { findOwnedFirst } from '@/lib/db/owned';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;

    const invoice = await findOwnedFirst<Invoice>(prisma.invoice, id, session.user.id, {
      include: { lineItems: true, client: true },
    });

    if (!invoice) {
      return new NextResponse('Invoice not found', { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const existing = await findOwnedFirst<Invoice>(prisma.invoice, id, session.user.id);
    if (!existing) {
      return new NextResponse('Invoice not found', { status: 404 });
    }

    const body = await request.json();
    const { status, ...data } = body;

    const invoice = await prisma.invoice.update({
      where: { id, userId: session.user.id },
      data: {
        ...data,
        status: status || 'DRAFT',
      },
      include: {
        lineItems: true,
        client: true,
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const existing = await findOwnedFirst<Invoice>(prisma.invoice, id, session.user.id);
    if (!existing) {
      return new NextResponse('Invoice not found', { status: 404 });
    }

    await prisma.invoice.delete({
      where: { id, userId: session.user.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
