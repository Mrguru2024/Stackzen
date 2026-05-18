import Link from 'next/link';
import { Award, Bell, Calendar, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface GrantsComingSoonProps {
  className?: string;
}

const plannedFeatures = [
  'Live grant listings from trusted public sources',
  'Profile-based matching for your industry and location',
  'Deadline reminders in your financial timeline',
  'Save opportunities and open official application sites',
] as const;

export default function GrantsComingSoon({ className }: GrantsComingSoonProps) {
  return (
    <div className={cn('mx-auto w-full max-w-2xl px-4 py-12 sm:py-16', className)}>
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Award className="h-8 w-8" aria-hidden />
        </div>

        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Coming soon
        </span>

        <h1 className="text-3xl font-bold tracking-tight">Funding Finder</h1>
        <p className="mt-3 max-w-lg text-muted-foreground">
          We&apos;re building a grants and funding discovery tool for freelancers, creatives, and
          small businesses — with real listings, real deadlines, and no fake apply flows.
        </p>

        <Card className="mt-10 w-full text-left">
          <CardHeader>
            <CardTitle className="text-lg">What&apos;s planned</CardTitle>
            <CardDescription>
              Built for StackZen income profiles — especially freelance and side-hustle earners.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {plannedFeatures.map(feature => (
                <li key={feature} className="flex gap-3 text-sm text-foreground">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="default">
            <Link href="/income">Back to Income</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ExternalLink className="mr-2 h-4 w-4" aria-hidden />
              Dashboard
            </Link>
          </Button>
        </div>

        <p className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Bell className="h-3.5 w-3.5" aria-hidden />
          You&apos;ll see this in the sidebar when it&apos;s ready — no action needed now.
        </p>
      </div>
    </div>
  );
}
