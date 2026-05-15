'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Icons } from '@/components/ui/icons';

export default function TestSimple() {
  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is a test card to verify imports work.</p>
          <Button>
            <Icons.plus className="mr-2 h-4 w-4" />
            Test Button
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
