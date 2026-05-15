'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { useSavingsRulesRealtime } from '@/hooks/useSupabaseRealtime';

export default function RealTimeTest() {
  const { rules, loading } = useSavingsRulesRealtime();
  const [testCount, setTestCount] = useState(0);

  const addTestRule = async () => {
    try {
      const response = await fetch('/api/smart-saving/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Test Rule ${testCount + 1}`,
          type: 'test',
          config: { enabled: true, test: true },
        }),
      });

      if (response.ok) {
        setTestCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error adding test rule:', error);
    }
  };

  return (
    <Card className="border-2 border-dashed border-blue-300">
      <CardHeader>
        <CardTitle className="text-blue-600">Real-time Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              This component tests real-time subscriptions. Add a test rule and watch it appear
              instantly!
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={addTestRule} variant="outline" size="sm">
              Add Test Rule
            </Button>
            <span className="text-sm text-muted-foreground">
              Rules: {loading ? 'Loading...' : rules.length}
            </span>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Current Rules:</h4>
            {rules.map(rule => (
              <div key={rule.id} className="rounded bg-gray-50 p-2 text-sm">
                {rule.name} ({rule.type}) - {rule.is_active ? 'Active' : 'Inactive'}
              </div>
            ))}
          </div>

          <div className="text-xs text-muted-foreground">
            💡 If you see rules appear instantly when you click &quot;Add Test Rule&quot;, real-time
            is working! If not, check the Supabase setup.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
