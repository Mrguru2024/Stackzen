'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DeviceFingerprint } from '@/lib/auth/device-fingerprint';
import type { DeviceInfo } from '@/types/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui';
import { Icons } from '@/components/ui';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDistanceToNow } from 'date-fns';
import { format } from 'date-fns';
import { Smartphone, Tablet, Monitor } from 'lucide-react';

type DeviceWithMetadata = DeviceInfo & {
  lastSeen: string;
  isCurrent: boolean;
};

export default function DevicesPage() {
  const [devices, setDevices] = useState<DeviceWithMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: devices, error } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', user.id)
        .order('last_seen', { ascending: false });

      if (error) throw error;

      const currentDevice = await DeviceFingerprint.getInstance().generateDeviceInfo();
      const devicesWithMetadata = devices.map(device => ({
        ...device.device_info,
        lastSeen: device.last_seen,
        isCurrent: device.device_info.fingerprint === currentDevice.fingerprint,
      }));

      setDevices(devicesWithMetadata);
    } catch (err: any) {
      console.error('Error loading devices:', err);
      setError(err.message || 'Failed to load devices');
    } finally {
      setIsLoading(false);
    }
  };

  const removeDevice = async (fingerprint: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_devices')
        .delete()
        .eq('user_id', user.id)
        .eq('device_info->fingerprint', fingerprint);

      if (error) throw error;

      setDevices(devices.filter(d => d.fingerprint !== fingerprint));
      toast.success('Device removed successfully');
    } catch (err: any) {
      console.error('Error removing device:', err);
      toast.error(err.message || 'Failed to remove device');
    }
  };

  const getDeviceType = (device: DeviceWithMetadata) => {
    if (device.mobileInfo?.isNativeApp) {
      return {
        icon: <Smartphone className="h-4 w-4" />,
        label: 'Native App',
      };
    }
    if (device.mobileInfo?.isTablet) {
      return {
        icon: <Tablet className="h-4 w-4" />,
        label: 'Tablet',
      };
    }
    if (device.mobileInfo?.isMobile) {
      return {
        icon: <Smartphone className="h-4 w-4" />,
        label: 'Mobile Browser',
      };
    }
    return {
      icon: <Monitor className="h-4 w-4" />,
      label: 'Desktop',
    };
  };

  const getDeviceDetails = (device: DeviceWithMetadata) => {
    const details: string[] = [];

    if (device.mobileInfo?.deviceModel) {
      details.push(device.mobileInfo.deviceModel);
    }
    if (device.mobileInfo?.osVersion) {
      details.push(device.mobileInfo.osVersion);
    }
    if (device.mobileInfo?.appVersion) {
      details.push(`v${device.mobileInfo.appVersion}`);
    }

    return details.join(' • ');
  };

  const getSecurityStatus = (device: DeviceWithMetadata) => {
    const status: React.ReactElement[] = [];

    // System integrity checks
    if (device.mobileInfo?.systemIntegrity?.isCompromised) {
      status.push(
        <Badge key="compromised" variant="destructive">
          Compromised
        </Badge>
      );
    }

    // Security features
    if (device.mobileInfo?.hasScreenLock) {
      status.push(
        <Badge key="screen-lock" variant="secondary">
          Screen Lock
        </Badge>
      );
    }
    if (device.mobileInfo?.hasBiometrics) {
      status.push(
        <Badge key="biometrics" variant="secondary">
          Biometrics
        </Badge>
      );
    }

    // Security issues
    if (device.mobileInfo?.hasRootAccess) {
      status.push(
        <Badge key="root" variant="destructive">
          Rooted
        </Badge>
      );
    }
    if (device.mobileInfo?.isJailbroken) {
      status.push(
        <Badge key="jailbreak" variant="destructive">
          Jailbroken
        </Badge>
      );
    }
    if (device.mobileInfo?.isEmulator) {
      status.push(
        <Badge key="emulator" variant="warning">
          Emulator
        </Badge>
      );
    }
    if (device.mobileInfo?.hasDebugger) {
      status.push(
        <Badge key="debugger" variant="warning">
          Debugger
        </Badge>
      );
    }

    // Location-based security
    if (device.location?.isProxy) {
      status.push(
        <Badge key="proxy" variant="warning">
          Proxy
        </Badge>
      );
    }
    if (device.location?.isVpn) {
      status.push(
        <Badge key="vpn" variant="warning">
          VPN
        </Badge>
      );
    }
    if (device.location?.isTor) {
      status.push(
        <Badge key="tor" variant="destructive">
          Tor
        </Badge>
      );
    }

    return status;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Devices</h2>
          <p className="text-muted-foreground">Manage and monitor your connected devices</p>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Security</TableHead>
              <TableHead>Last Seen</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map(device => {
              const deviceType = getDeviceType(device);
              const deviceDetails = getDeviceDetails(device);
              const securityStatus = getSecurityStatus(device);

              return (
                <TableRow key={device.fingerprint}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {deviceType.icon}
                      <div>
                        <div className="font-medium">{deviceType.label}</div>
                        {deviceDetails && (
                          <div className="text-sm text-muted-foreground">{deviceDetails}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {device.location?.city}, {device.location?.country}
                      </div>
                      <div className="text-sm text-muted-foreground">{device.location?.isp}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">{securityStatus}</div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {formatDistanceToNow(new Date(device.lastSeen), {
                          addSuffix: true,
                        })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(device.lastSeen), 'PPp')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDevice(device.fingerprint)}
                      disabled={device.isCurrent}
                    >
                      {device.isCurrent ? 'Current' : 'Remove'}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
