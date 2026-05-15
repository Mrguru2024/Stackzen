'use client';

import React from 'react';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Icons } from '@/components/ui/icons';

export function MinimalExportDialog() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button variant="outline" onClick={() => setOpen(!open)}>
        <Icons.download className="mr-2 h-4 w-4" />
        Minimal Export
      </Button>
      {open && (
        <div className="mt-4 rounded border p-4">
          <p>Export dialog content</p>
          <Button disabled>
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </Button>
        </div>
      )}
    </div>
  );
}
