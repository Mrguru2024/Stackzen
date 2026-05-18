import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';
import { logSafeError } from '@/lib/security/safe-log';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  context: { params: Promise<{ invoiceId: string }> }
) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  try {
    const { invoiceId } = await context.params;
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId: session.user.id },
      include: {
        lineItems: true,
        client: true,
        user: { select: { image: true } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    let y = 760;

    const logoPath = invoice.user?.image;
    if (logoPath?.startsWith('/')) {
      try {
        const fullPath = path.join(process.cwd(), 'public', logoPath.replace(/^\//, ''));
        const logoBytes = await fs.readFile(fullPath);
        const logoImage = await pdfDoc.embedPng(logoBytes);
        const logoWidth = 150;
        const logoHeight = (logoImage.height * logoWidth) / logoImage.width;
        page.drawImage(logoImage, {
          x: 40,
          y: y - logoHeight,
          width: logoWidth,
          height: logoHeight,
        });
        y -= logoHeight + 20;
      } catch {
        // Continue without logo
      }
    }

    page.drawText('StackZen Invoice', { x: 40, y, size: 24, font, color: rgb(0.37, 0.18, 0.92) });
    y -= 40;
    page.drawText(`Invoice #: ${invoice.number}`, { x: 40, y, size: 14, font });
    page.drawText(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, {
      x: 400,
      y,
      size: 14,
      font,
    });
    y -= 24;
    page.drawText(`Client: ${invoice.client.name}`, { x: 40, y, size: 14, font });
    if (invoice.client.email) {
      page.drawText(`Email: ${invoice.client.email}`, { x: 40, y: y - 18, size: 12, font });
    }
    y -= 40;
    page.drawText(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, {
      x: 40,
      y,
      size: 12,
      font,
    });
    const isPaid = invoice.status === 'paid';
    page.drawText(`Status: ${isPaid ? 'Paid' : invoice.status}`, {
      x: 400,
      y,
      size: 12,
      font,
      color: isPaid ? rgb(0.2, 0.7, 0.3) : rgb(1, 0.7, 0.2),
    });
    y -= 32;

    page.drawText('Description', { x: 40, y, size: 12, font });
    page.drawText('Qty', { x: 300, y, size: 12, font });
    page.drawText('Unit Price', { x: 360, y, size: 12, font });
    page.drawText('Amount', { x: 470, y, size: 12, font });
    y -= 18;
    page.drawLine({
      start: { x: 40, y },
      end: { x: 560, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 10;

    invoice.lineItems.forEach(item => {
      page.drawText(item.description, { x: 40, y, size: 12, font });
      page.drawText(String(item.quantity), { x: 300, y, size: 12, font });
      page.drawText(`$${item.unitPrice.toFixed(2)}`, { x: 360, y, size: 12, font });
      page.drawText(`$${item.amount.toFixed(2)}`, { x: 470, y, size: 12, font });
      y -= 18;
    });
    y -= 10;
    page.drawLine({
      start: { x: 40, y },
      end: { x: 560, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 24;

    const total =
      invoice.lineItems.length > 0
        ? invoice.lineItems.reduce((sum, lineItem) => sum + lineItem.amount, 0)
        : invoice.amount;
    page.drawText('Total:', { x: 360, y, size: 14, font });
    page.drawText(`$${total.toFixed(2)}`, { x: 470, y, size: 14, font });

    const pdfBytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=invoice-${invoice.number}.pdf`,
      },
    });
  } catch (error) {
    logSafeError('INVOICE_DOWNLOAD', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
