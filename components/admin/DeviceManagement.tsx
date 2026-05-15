import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui';
import { formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Device {
  id: string;
  userId: string;
  userEmail: string;
  deviceId: string;
  userAgent: string;
  lastSeen: Date;
  isTrusted: boolean;
  location: string;
  ipAddress: string;
}

export function DeviceManagement() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/admin/devices');
      if (!response.ok) throw new Error('Failed to fetch devices');
      const data = await response.json();
      setDevices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  };

  const handleTrustDevice = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/admin/devices/${deviceId}/trust`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to trust device');
      await fetchDevices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trust device');
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/admin/devices/${deviceId}/revoke`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to revoke device');
      await fetchDevices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke device');
    }
  };

  const filteredDevices = devices.filter(device => {
    const matchesSearch =
      device.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.deviceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.ipAddress.includes(searchQuery);

    const matchesFilter =
      filter === 'all' ||
      (filter === 'trusted' && device.isTrusted) ||
      (filter === 'untrusted' && !device.isTrusted);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center">
          <p>Loading devices...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Device Management</CardTitle>
          <CardDescription>
            Manage and monitor device access across your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center space-x-4">
            <Input
              placeholder="Search by email, device ID, or IP..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter devices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Devices</SelectItem>
                <SelectItem value="trusted">Trusted Devices</SelectItem>
                <SelectItem value="untrusted">Untrusted Devices</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Device ID</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevices.map(device => (
                <TableRow key={device.id}>
                  <TableCell>{device.userEmail}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {device.deviceId.slice(0, 8)}...
                  </TableCell>
                  <TableCell>{device.location}</TableCell>
                  <TableCell>{device.ipAddress}</TableCell>
                  <TableCell>{formatDistanceToNow(new Date(device.lastSeen))} ago</TableCell>
                  <TableCell>
                    <Badge variant={device.isTrusted ? 'default' : 'secondary'}>
                      {device.isTrusted ? 'Trusted' : 'Untrusted'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {device.isTrusted ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevokeDevice(device.id)}
                        >
                          Revoke
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTrustDevice(device.id)}
                        >
                          Trust
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        Details
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
