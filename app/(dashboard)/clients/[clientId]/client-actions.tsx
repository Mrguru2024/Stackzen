'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import InvoiceFormModal from '@/components/Invoicing/InvoiceFormModal';
import { useState } from 'react';

interface ClientActionsProps {
  clientId: string;
}

export default function ClientActions({ clientId }: ClientActionsProps) {
  const router = useRouter();
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [documentType, setDocumentType] = useState<'invoice' | 'quote'>('invoice');

  return (
    <div className="flex gap-4">
      <Button variant="outline" onClick={() => router.push(`/clients/${clientId}/edit`)}>
        Edit Client
      </Button>
      <Button onClick={() => setIsCreatingInvoice(true)}>Create Invoice</Button>
      <InvoiceFormModal
        open={isCreatingInvoice}
        onOpenChange={setIsCreatingInvoice}
        initialClientId={clientId}
        documentType={documentType}
        setDocumentType={setDocumentType}
      />
    </div>
  );
}
