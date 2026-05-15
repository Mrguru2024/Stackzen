'use client';

import React from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Loader2, Copy, ExternalLink, BarChart2, Users, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

interface AffiliateLink {
  id: string;
  program: string;
  link: string;
  clicks: number;
  conversions: number;
  earnings: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export default function MyAffiliateLinksPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: affiliateLinks, isLoading } = useQuery<AffiliateLink[]>({
    queryKey: ['/api/affiliate-links'],
    queryFn: async () => {
      const response = await fetch('/api/affiliate-links');
      if (!response.ok) {
        throw new Error('Failed to fetch affiliate links');
      }
      return response.json();
    },
  });

  const filteredLinks = affiliateLinks?.filter(link =>
    link.program.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalEarnings = affiliateLinks?.reduce((sum, link) => sum + link.earnings, 0) || 0;
  const totalClicks = affiliateLinks?.reduce((sum, link) => sum + link.clicks, 0) || 0;
  const totalConversions = affiliateLinks?.reduce((sum, link) => sum + link.conversions, 0) || 0;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="container mx-auto space-y-8 py-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Affiliate Links</h1>
          <p className="text-muted-foreground">Manage and track your affiliate marketing links</p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search programs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-[200px]"
          />
          <Button className="gap-2" onClick={() => router.push('/income/affiliates/analytics')}>
            <BarChart2 size={16} />
            Analytics
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalEarnings.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Lifetime earnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalClicks.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Link clicks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalConversions.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Successful conversions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Affiliate Links</CardTitle>
          <CardDescription>Manage your affiliate links and track their performance</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Conversions</TableHead>
                  <TableHead className="text-right">Earnings</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLinks?.map(link => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">{link.program}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{link.link}</TableCell>
                    <TableCell className="text-right">{link.clicks}</TableCell>
                    <TableCell className="text-right">{link.conversions}</TableCell>
                    <TableCell className="text-right">${link.earnings}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={link.status === 'active' ? 'default' : 'secondary'}>
                        {link.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(link.link)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(link.link, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
