import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import ClientActions from './client-actions';

interface ClientPageProps {
  params: Promise<{ clientId: string }>;
}

export default async function ClientPage({ params }: ClientPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { clientId } = await params;

  const client = await prisma.client.findFirst({
    where: { id: clientId, userId: session.user.id },
    include: {
      invoices: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!client) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{client.name}</h1>
          <p className="text-muted-foreground">{client.email}</p>
        </div>
        <ClientActions clientId={client.id} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p>{client.email}</p>
            </div>
            {client.phone && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p>{client.phone}</p>
              </div>
            )}
            {client.address && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p>{client.address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {client.invoices.length === 0 ? (
              <p className="text-muted-foreground">No invoices yet</p>
            ) : (
              <div className="space-y-4">
                {client.invoices.map(invoice => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">Invoice #{invoice.number}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(invoice.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${invoice.amount.toLocaleString()}</p>
                      <p
                        className={`text-sm ${
                          invoice.status === 'paid'
                            ? 'text-green-600'
                            : invoice.status === 'overdue'
                              ? 'text-red-600'
                              : 'text-yellow-600'
                        }`}
                      >
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
