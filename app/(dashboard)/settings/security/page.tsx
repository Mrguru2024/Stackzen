import Link from 'next/link';
import { Shield, Laptop, ClipboardList, Settings2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';

export default function SecuritySettingsHubPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Security Center</h1>
        <p className="text-muted-foreground">
          Review devices, security events, and account protection preferences.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Laptop className="h-4 w-4" />
              Device Sessions
            </CardTitle>
            <CardDescription>Remove unknown devices and monitor active sessions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/settings/security/devices">Manage Devices</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4" />
              Audit Events
            </CardTitle>
            <CardDescription>Track login attempts and suspicious account activity.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/settings/security/audit">View Audit Log</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 className="h-4 w-4" />
              Protection Rules
            </CardTitle>
            <CardDescription>Define strictness for VPN, proxy, Tor, and threat levels.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/settings/security/preferences">Edit Rules</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Security Best Practice
          </CardTitle>
          <CardDescription>
            Keep at least one trusted device, review audit log weekly, and raise threat threshold only
            when necessary.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
