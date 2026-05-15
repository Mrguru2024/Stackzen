'use client';

import React from 'react';
import { Button } from '@/components/ui';
import { Icons } from '@/components/ui/icons';

export function DataExportDialog() {
  return (
    <div>
      <Button variant="outline">
        <Icons.download className="mr-2 h-4 w-4" />
        Export Data
      </Button>
    </div>
  );
}
