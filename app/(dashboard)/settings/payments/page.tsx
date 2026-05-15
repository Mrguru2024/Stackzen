import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StripeConnectCard, type StripeConnectStatus } from '@/components/StripeConnectCard';
import { getCachedStatus } from '@/lib/stripe/connect';
import { CreditCard, FileText, MailCheck, Sparkles } from 'lucide-react';

const HOW_IT_WORKS: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }[] = [
  {
    icon: CreditCard,
    title: 'Connect your Stripe account',
    body:
      'Click "Connect with Stripe" and follow the guided sign-up. Stripe handles ID verification and bank linking for you.',
  },
  {
    icon: FileText,
    title: 'Create an invoice in StackZen',
    body:
      'Add line items, set a due date and pick a client. We mirror the invoice into Stripe behind the scenes.',
  },
  {
    icon: MailCheck,
    title: 'Stripe emails the client',
    body:
      'Your client receives a beautifully formatted invoice with a one-click payment page. They can pay by card, Apple Pay, or bank transfer.',
  },
  {
    icon: Sparkles,
    title: 'Get paid automatically',
    body:
      'Funds land in your Stripe balance and pay out to your bank — usually in 2 business days. We mark the invoice paid for you.',
  },
];

export default async function PaymentsSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/settings/payments');
  }

  const initialStatus: StripeConnectStatus = await getCachedStatus(session.user.id);

  return (
    <div className="container mx-auto max-w-4xl space-y-8 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">
          Connect Stripe once and every StackZen invoice turns into a secure online payment page —
          card data stays with Stripe, and payouts land in your bank.
        </p>
      </header>

      <StripeConnectCard initialStatus={initialStatus} />

      <Card>
        <CardHeader>
          <CardTitle>How online payments work</CardTitle>
          <CardDescription>
            Each step is guided and there is nothing to install on your side.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-4 sm:grid-cols-2">
            {HOW_IT_WORKS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.title}
                  className="flex gap-3 rounded-lg border bg-muted/30 p-4 text-sm"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Step {idx + 1}
                    </p>
                    <p className="font-medium">{step.title}</p>
                    <p className="mt-1 text-muted-foreground">{step.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Frequently asked questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-medium">Do I need a Stripe account already?</p>
            <p className="text-muted-foreground">
              No. The "Connect with Stripe" button creates one for you in a few minutes.
              You can also link an existing Stripe account during the same flow.
            </p>
          </div>
          <div>
            <p className="font-medium">What does Stripe charge?</p>
            <p className="text-muted-foreground">
              Stripe charges its standard processing fee per successful payment (typically
              2.9% + $0.30). StackZen does not add any platform fee.
            </p>
          </div>
          <div>
            <p className="font-medium">Can I disconnect later?</p>
            <p className="text-muted-foreground">
              Yes — disconnecting stops new payment links from being created. Existing payment
              pages keep working until you mark the invoice paid in StackZen.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
