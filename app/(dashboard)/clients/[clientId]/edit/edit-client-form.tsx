'use client';

import React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Icons } from '@/components/ui';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { showErrorToast, showSuccessToast } from '@/lib/utils';

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

interface EditClientFormProps {
  client: Client;
}

export default function EditClientForm({ client }: EditClientFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get('name')?.toString() || '',
      email: formData.get('email')?.toString() || '',
      phone: formData.get('phone')?.toString() || null,
      address: formData.get('address')?.toString() || null,
    };

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update client');
      }

      showSuccessToast('Client updated successfully');
      router.push(`/clients/${client.id}`);
      router.refresh();
    } catch (error) {
      showErrorToast('Failed to update client. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // Ensure all values are strings or null
  const safeValues = {
    name: client.name || '',
    email: client.email || '',
    phone: client.phone || '',
    address: client.address || '',
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4" aria-label="Edit client form">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Client name"
          defaultValue={safeValues.name}
          required
          disabled={isLoading}
          aria-required="true"
          aria-invalid={false}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="client@example.com"
          defaultValue={safeValues.email}
          required
          disabled={isLoading}
          aria-required="true"
          aria-invalid={false}
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="123-456-7890"
          defaultValue={safeValues.phone}
          disabled={isLoading}
          autoComplete="tel"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          name="address"
          placeholder="123 Main St"
          defaultValue={safeValues.address}
          disabled={isLoading}
          autoComplete="street-address"
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isLoading}
          aria-label={isLoading ? 'Saving changes...' : 'Save changes'}
        >
          {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
          aria-label="Cancel editing"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
