import React from 'react';
import SavedQuotesClient from './SavedQuotesClient';
import type { SavedQuote } from '@/components/SavedQuotes';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { ThemeToggle } from '@/components/ThemeToggle';

const QUOTES_PER_PAGE = 10;

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Drafts', value: 'draft' },
  { label: 'Sent', value: 'sent' },
];

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const params = await searchParams;
  const contractorId = session.user.id;
  const page = parseInt((params?.page as string) || '1', 10);
  const search = (params?.search as string) || '';
  const status = (params?.status as string) || '';

  const where: any = contractorId ? { userId: contractorId } : {};
  if (status) {
    where.status = status;
  }

  try {
    const totalCount = await prisma.quote.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalCount / QUOTES_PER_PAGE));

    const quotes = await prisma.quote.findMany({
      where,
      skip: (page - 1) * QUOTES_PER_PAGE,
      take: QUOTES_PER_PAGE,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    const clientQuotes: SavedQuote[] = quotes.map(q => ({
      id: q.id,
      createdAt: q.createdAt.toISOString(),
      customerName: q.user?.name?.trim() || 'Unknown',
      serviceType: q.title,
      price: 0,
      status: q.status,
      number: q.id.slice(-8),
    }));

    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between pb-8 pt-6">
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Quotes</h1>
            <div className="flex gap-2">
              {STATUS_TABS.map(tab => (
                <a
                  key={tab.value}
                  href={`?status=${tab.value}`}
                  className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                    status === tab.value || (!status && tab.value === '')
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </a>
              ))}
            </div>
          </div>
          <ThemeToggle />
        </div>
        <SavedQuotesClient
          quotes={clientQuotes}
          totalPages={totalPages}
          currentPage={page}
          search={search}
          statusFilter={status}
        />
      </div>
    );
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Failed to load quotes. Please try again later.</p>
      </div>
    );
  }
}
