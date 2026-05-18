'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MET_REPAIRS_PRODUCTION_URL } from '@/lib/integrations/met-repairs/paths';

interface MetRepairsIntegrationSettingsProps {
  configured: boolean;
  apiUrl: string;
}

type GenerateKeyResponse = {
  apiKey: string;
  metRepairsApiUrl: string;
  stackZenEnvVar: string;
  metRepairsEnvVar: string;
  instructions: string[];
};

export function MetRepairsIntegrationSettings({
  configured,
  apiUrl,
}: MetRepairsIntegrationSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GenerateKeyResponse | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const res = await fetch('/api/admin/integrations/met-repairs/generate-key', {
        method: 'POST',
      });
      const body = (await res.json()) as GenerateKeyResponse & { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? 'Failed to generate key');
      }
      setGenerated(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate key');
    } finally {
      setLoading(false);
    }
  }

  async function copyKey() {
    if (!generated?.apiKey) return;
    await navigator.clipboard.writeText(generated.apiKey);
    setCopied(true);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">MET Repairs integration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Production consumer connection for the Financial Command Center (read-only).
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status</CardTitle>
          <CardDescription>
            StackZen calls MET Repairs OS at{' '}
            <span className="font-mono text-foreground">{apiUrl || MET_REPAIRS_PRODUCTION_URL}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Integration:{' '}
            <span className={configured ? 'text-emerald-600' : 'text-amber-600'}>
              {configured ? 'Configured' : 'Not configured'}
            </span>
          </p>
          <p className="text-muted-foreground">
            The same secret must be set as <code className="text-xs">MET_REPAIRS_API_KEY</code> on
            StackZen and <code className="text-xs">STACKZEN_API_KEY</code> on MET Repairs OS.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/met-repairs">Open Financial Command Center</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Generate integration key</CardTitle>
          <CardDescription>
            Creates a new server-to-server key. Shown once — store it in Vercel for both projects.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating…' : 'Generate new key'}
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {generated ? (
            <section className="space-y-3 rounded-lg border bg-muted/30 p-4 text-sm">
              <p className="font-medium text-foreground">Copy this key now</p>
              <pre className="overflow-x-auto rounded bg-background p-3 font-mono text-xs">
                {generated.apiKey}
              </pre>
              <Button type="button" variant="secondary" size="sm" onClick={copyKey}>
                {copied ? 'Copied' : 'Copy key'}
              </Button>
              <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                {generated.instructions.map(step => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">CLI alternative</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="rounded bg-muted p-3 font-mono text-xs">npm run met-repairs:generate-key</pre>
        </CardContent>
      </Card>
    </div>
  );
}
