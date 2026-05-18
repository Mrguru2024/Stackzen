import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMentorPortal } from '@/lib/mentors/require-mentor-portal';
import {
  getMentorConnectCachedStatus,
  mentorCanReceiveSessionPayouts,
} from '@/lib/stripe/mentor-connect';

/** Read-only earnings ledger — no export/download headers. */
export async function GET() {
  const { ctx, response } = await requireMentorPortal();
  if (response || !ctx) return response;

  const sessions = await prisma.mentorSession.findMany({
    where: { mentorId: ctx.mentor.id },
    orderBy: { scheduledAt: 'desc' },
    take: 100,
    select: {
      id: true,
      sessionType: true,
      status: true,
      scheduledAt: true,
      price: true,
      platformFee: true,
      mentorPayout: true,
      stripeSessionId: true,
      user: { select: { name: true } },
    },
  });

  const payout = await mentorCanReceiveSessionPayouts(ctx.mentor.id);
  const connectStatus = await getMentorConnectCachedStatus(ctx.userId);

  const rows = sessions.map(s => ({
    id: s.id,
    sessionType: s.sessionType,
    status: s.status,
    scheduledAt: s.scheduledAt.toISOString(),
    gross: s.price,
    platformFee: s.platformFee,
    mentorPayout: s.mentorPayout,
    paid: Boolean(s.stripeSessionId),
    memberName: s.user.name ?? 'Member',
  }));

  const totals = rows.reduce(
    (acc, r) => {
      if (r.status === 'COMPLETED' || r.status === 'CONFIRMED') {
        acc.earned += r.mentorPayout;
        acc.gross += r.gross;
      }
      if (r.status === 'SCHEDULED' || r.status === 'CONFIRMED') {
        acc.pending += r.mentorPayout;
      }
      return acc;
    },
    { earned: 0, pending: 0, gross: 0 }
  );

  return NextResponse.json(
    {
      totals: {
        earned: Math.round(totals.earned * 100) / 100,
        pending: Math.round(totals.pending * 100) / 100,
        gross: Math.round(totals.gross * 100) / 100,
      },
      ledger: rows,
      payouts: {
        mode: payout.ok ? 'stripe_connect' : 'platform_ledger',
        connectStatus: connectStatus.status,
        connectAccountId: connectStatus.accountId,
        message: payout.ok
          ? 'Paid sessions split to your mentor Stripe account (separate from Settings → Payments).'
          : 'Earnings appear in this in-app ledger until you connect Stripe for session payouts under Income → Session payout account.',
      },
      readOnly: true,
      exportDisabled: true,
    },
    {
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Disposition': 'inline',
      },
    }
  );
}
