'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Icons } from '@/components/ui';
import { ThemeToggle } from '@/components/ThemeToggle';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchClients() {
      try {
        const response = await fetch('/api/clients');
        if (!response.ok) {
          throw new Error('Failed to fetch clients');
        }
        const data = await response.json();
        setClients(data);
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchClients();
  }, []);

  return (
    <div className="w-full flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between pb-8 pt-6">
        <h1 className="text-3xl font-bold">Clients</h1>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <Link href="/clients/new">
            <Button>
              <Icons.plus className="mr-2 h-4 w-4" />
              New Client
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <Icons.spinner className="h-8 w-8 animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="mb-4 text-muted-foreground">No clients found</p>
            <Link href="/clients/new">
              <Button>
                <Icons.plus className="mr-2 h-4 w-4" />
                Create Your First Client
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map(client => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardHeader>
                  <CardTitle>{client.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{client.email}</p>
                  {client.phone && <p className="text-sm text-muted-foreground">{client.phone}</p>}
                  {client.address && (
                    <p className="text-sm text-muted-foreground">{client.address}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
