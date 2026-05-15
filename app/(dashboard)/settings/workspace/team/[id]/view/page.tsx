'use client';

import React from 'react';

import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Bell, MessageSquare, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const TeamViewPage = () => {
  const router = useRouter();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-x-2 space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Team View</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon">
            <span className="sr-only">View Notifications</span>
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <span className="sr-only">View Messages</span>
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <span className="sr-only">View Settings</span>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <svg
              className="h-4 w-4 text-gray-300"
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.019 11.019 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 001.226 1.226l.74-.74a1 1 0 00.54-1.06l.774-4.435a11.02 11.02 0 00-6.105-6.105l-1.548.773a1 1 0 00-.54 1.059v2.153a1 1 0 00.836.986l4.435.74a1 1 0 011.226 1.226l-.74 4.435a1 1 0 00.54 1.06l.774-4.435a11.02 11.02 0 006.105 6.105l4.435.774a1 1 0 011.226 1.226l-.74 4.435a1 1 0 001.06 1.226l4.435-.74a11.02 11.02 0 006.105-6.105l.774 4.435a1 1 0 01-1.226 1.226l-4.435-.74a11.02 11.02 0 00-6.105-6.105l-4.435.774a1 1 0 01-1.06-1.226l.74-4.435a1 1 0 00-.54-1.06l.774-4.435a11.02 11.02 0 006.105-6.105l1.548.773a1 1 0 00.54-1.059V3a1 1 0 00-1-1H3z"
                clipRule="evenodd"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">+200</div>
            <p className="text-xs text-gray-400">+20 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <svg
              className="h-4 w-4 text-gray-300"
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.019 11.019 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 001.226 1.226l.74-.74a1 1 0 00.54-1.06l.774-4.435a11.02 11.02 0 00-6.105-6.105l-1.548.773a1 1 0 00-.54 1.059v2.153a1 1 0 00.836.986l4.435.74a1 1 0 011.226 1.226l-.74 4.435a1 1 0 00.54 1.06l.774-4.435a11.02 11.02 0 006.105 6.105l4.435.774a1 1 0 011.226 1.226l-.74 4.435a1 1 0 001.06 1.226l4.435-.74a11.02 11.02 0 006.105-6.105l.774 4.435a1 1 0 01-1.226 1.226l-4.435-.74a11.02 11.02 0 00-6.105-6.105l-4.435.774a1 1 0 01-1.06-1.226l.74-4.435a1 1 0 00-.54-1.06l.774-4.435a11.02 11.02 0 006.105-6.105l1.548.773a1 1 0 00.54-1.059V3a1 1 0 00-1-1H3z"
                clipRule="evenodd"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">+200</div>
            <p className="text-xs text-gray-400">+20 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <svg
              className="h-4 w-4 text-gray-300"
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.019 11.019 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 001.226 1.226l.74-.74a1 1 0 00.54-1.06l.774-4.435a11.02 11.02 0 00-6.105-6.105l-1.548.773a1 1 0 00-.54 1.059v2.153a1 1 0 00.836.986l4.435.74a1 1 0 011.226 1.226l-.74 4.435a1 1 0 00.54 1.06l.774-4.435a11.02 11.02 0 006.105 6.105l4.435.774a1 1 0 011.226 1.226l-.74 4.435a1 1 0 001.06 1.226l4.435-.74a11.02 11.02 0 006.105-6.105l.774 4.435a1 1 0 01-1.226 1.226l-4.435-.74a11.02 11.02 0 00-6.105-6.105l-4.435.774a1 1 0 01-1.06-1.226l.74-4.435a1 1 0 00-.54-1.06l.774-4.435a11.02 11.02 0 006.105-6.105l1.548.773a1 1 0 00.54-1.059V3a1 1 0 00-1-1H3z"
                clipRule="evenodd"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">+200</div>
            <p className="text-xs text-gray-400">+20 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <svg
              className="h-4 w-4 text-gray-300"
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.019 11.019 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 001.226 1.226l.74-.74a1 1 0 00.54-1.06l.774-4.435a11.02 11.02 0 00-6.105-6.105l-1.548.773a1 1 0 00-.54 1.059v2.153a1 1 0 00.836.986l4.435.74a1 1 0 011.226 1.226l-.74 4.435a1 1 0 00.54 1.06l.774-4.435a11.02 11.02 0 006.105 6.105l4.435.774a1 1 0 011.226 1.226l-.74 4.435a1 1 0 001.06 1.226l4.435-.74a11.02 11.02 0 006.105-6.105l.774 4.435a1 1 0 01-1.226 1.226l-4.435-.74a11.02 11.02 0 00-6.105-6.105l-4.435.774a1 1 0 01-1.06-1.226l.74-4.435a1 1 0 00-.54-1.06l.774-4.435a11.02 11.02 0 006.105-6.105l1.548.773a1 1 0 00.54-1.059V3a1 1 0 00-1-1H3z"
                clipRule="evenodd"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">+200</div>
            <p className="text-xs text-gray-400">+20 from last month</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamViewPage;
