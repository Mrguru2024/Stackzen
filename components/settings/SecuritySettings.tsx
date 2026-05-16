'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui';
import { formatDistanceToNow } from 'date-fns';

interface SecuritySettingsProps {
  twoFactorStatus: {
    enabled: boolean;
    backupCodesRemaining: number;
  };
  blockedIPs: Array<{ ip: string; timestamp: string; reason: string }>;
  suspiciousIPs: Array<{ ip: string; timestamp: string; reason: string }>;
  userId: string;
}

export function SecuritySettings({
  twoFactorStatus,
  blockedIPs,
  suspiciousIPs,
  userId,
}: SecuritySettingsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCode, setQrCode] = useState('');

  const handleSetup2FA = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to setup 2FA');
      }

      const data = await response.json();
      setQrCode(data.qrCode);
      setShowQRCode(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code: twoFactorCode }),
      });

      if (!response.ok) {
        throw new Error('Invalid 2FA code');
      }

      setSuccess('2FA has been enabled successfully');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code: twoFactorCode }),
      });

      if (!response.ok) {
        throw new Error('Failed to disable 2FA');
      }

      setSuccess('2FA has been disabled successfully');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnblockIP = async (ip: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/security/unblock-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip }),
      });

      if (!response.ok) {
        throw new Error('Failed to unblock IP');
      }

      setSuccess('IP has been unblocked successfully');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tabs defaultValue="2fa" className="space-y-6">
      <TabsList>
        <TabsTrigger value="2fa">Two-Factor Authentication</TabsTrigger>
        <TabsTrigger value="devices">Device Management</TabsTrigger>
        <TabsTrigger value="ip-blocking">IP Blocking</TabsTrigger>
      </TabsList>

      <TabsContent value="2fa">
        <Card>
          <CardHeader>
            <CardTitle>Two-Factor Authentication</CardTitle>
            <CardDescription>Add an extra layer of security to your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  {twoFactorStatus.enabled
                    ? 'Enabled'
                    : 'Add an extra layer of security to your account'}
                </p>
              </div>
              <Switch
                checked={twoFactorStatus.enabled}
                onCheckedChange={twoFactorStatus.enabled ? handleDisable2FA : handleSetup2FA}
                disabled={isLoading}
              />
            </div>

            {showQRCode && (
              <div className="space-y-4">
                <Image
                  src={qrCode}
                  alt="2FA QR Code"
                  width={200}
                  height={200}
                  className="mx-auto"
                />
                <div className="space-y-2">
                  <Label>Enter the 6-digit code from your authenticator app</Label>
                  <Input
                    type="text"
                    value={twoFactorCode}
                    onChange={e => setTwoFactorCode(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                  />
                  <Button
                    onClick={handleVerify2FA}
                    disabled={isLoading || twoFactorCode.length !== 6}
                  >
                    Verify and Enable
                  </Button>
                </div>
              </div>
            )}

            {twoFactorStatus.enabled && (
              <div className="space-y-2">
                <Label>Backup Codes</Label>
                <p className="text-sm text-muted-foreground">
                  {twoFactorStatus.backupCodesRemaining} backup codes remaining
                </p>
                <Button
                  variant="outline"
                  onClick={() => router.push('/settings/security/backup-codes')}
                >
                  Generate New Backup Codes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="devices">
        <Card>
          <CardHeader>
            <CardTitle>Device Management</CardTitle>
            <CardDescription>Manage devices that have accessed your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Current Device</Label>
                  <p className="text-sm text-muted-foreground">
                    This device is currently logged in
                  </p>
                </div>
                <Badge variant="secondary">Current</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="ip-blocking">
        <Card>
          <CardHeader>
            <CardTitle>IP Blocking</CardTitle>
            <CardDescription>Manage blocked and suspicious IP addresses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {blockedIPs.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Blocked IPs</h3>
                <div className="space-y-2">
                  {blockedIPs.map(({ ip, timestamp, reason }) => (
                    <div
                      key={ip}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium">{ip}</p>
                        <p className="text-sm text-muted-foreground">
                          Blocked {formatDistanceToNow(new Date(timestamp))} ago
                        </p>
                        <p className="text-sm text-muted-foreground">{reason}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnblockIP(ip)}
                        disabled={isLoading}
                      >
                        Unblock
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {suspiciousIPs.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Suspicious IPs</h3>
                <div className="space-y-2">
                  {suspiciousIPs.map(({ ip, timestamp, reason }) => (
                    <div
                      key={ip}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium">{ip}</p>
                        <p className="text-sm text-muted-foreground">
                          Flagged {formatDistanceToNow(new Date(timestamp))} ago
                        </p>
                        <p className="text-sm text-muted-foreground">{reason}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnblockIP(ip)}
                        disabled={isLoading}
                      >
                        Remove Flag
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {blockedIPs.length === 0 && suspiciousIPs.length === 0 && (
              <p className="text-muted-foreground">No blocked or suspicious IPs</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
