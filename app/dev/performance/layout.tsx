import React from 'react';
import { Metadata } from 'next';
import { Navbar } from '@/components/ui/Navbar';

export const metadata: Metadata = {
  title: 'Performance Dashboard | StackZen',
  description: 'Monitor and analyze application performance metrics',
};

export default function PerformanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
