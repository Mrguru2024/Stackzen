'use client';

import React from 'react';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Icons } from '@/components/ui/icons';

export function TestExportDialog() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button variant="outline" onClick={() => setOpen(!open)}>
        <Icons.download className="mr-2 h-4 w-4" />
        Test Export
      </Button>
      {open && <div>Dialog is open</div>}
    </div>
  );
}

export default TestExportDialog;
