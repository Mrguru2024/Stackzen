import React from 'react';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/ui';
import EditClientForm from './edit-client-form';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clientId: string }>;
}): Promise<Metadata> {
  const { clientId } = await params;
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { name: true },
  });

  return {
    title: client ? `Edit ${client.name} - Client Management` : 'Edit Client',
    description: 'Edit client information and contact details',
  };
}

function LoadingState() {
  return (
    <div
      className="flex h-32 items-center justify-center"
      role="status"
      aria-label="Loading client data"
    >
      <Icons.spinner className="h-8 w-8 animate-spin" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

interface EditClientPageProps {
  params: Promise<{ clientId: string }>;
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const { clientId } = await params;

  const [session, client] = await Promise.all([
    getServerSession(authOptions),
    prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
      },
    }),
  ]);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  if (!client) {
    redirect('/clients');
  }

  return (
    <main className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Client</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<LoadingState />}>
            <EditClientForm client={client} />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
