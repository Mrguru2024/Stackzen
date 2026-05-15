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

// Generate metadata for better SEO
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    select: { name: true },
  });

  return {
    title: client ? `Edit ${client.name} - Client Management` : 'Edit Client',
    description: 'Edit client information and contact details',
  };
}

// Loading component for better UX
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
  params: { id: string };
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  // Fetch session and client data in parallel for better performance
  const [session, client] = await Promise.all([
    getServerSession(authOptions),
    prisma.client.findUnique({
      where: { id: params.id },
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
