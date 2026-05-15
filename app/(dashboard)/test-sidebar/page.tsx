import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function TestSidebarPage() {
  return (
    <div className="w-full flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between pb-8 pt-6">
        <h1 className="text-3xl font-bold">Sidebar Test Page</h1>
        <ThemeToggle />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h2 className="mb-2 text-xl font-semibold">Test Card 1</h2>
          <p className="text-gray-600 dark:text-gray-300">
            This is a test card to verify the sidebar layout is working properly.
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h2 className="mb-2 text-xl font-semibold">Test Card 2</h2>
          <p className="text-gray-600 dark:text-gray-300">
            The sidebar should be visible on desktop and accessible via menu button on mobile.
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h2 className="mb-2 text-xl font-semibold">Test Card 3</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Check that the mobile menu button appears in the top-left corner on mobile devices.
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20">
        <h3 className="mb-2 text-lg font-semibold">Instructions:</h3>
        <ul className="list-inside list-disc space-y-1 text-sm">
          <li>On desktop: The sidebar should be visible on the left side</li>
          <li>On mobile: Look for a menu button (☰) in the top-left corner</li>
          <li>The content should be properly spaced and not overlap with the sidebar</li>
          <li>Try resizing the browser window to test responsiveness</li>
        </ul>
      </div>
    </div>
  );
}
