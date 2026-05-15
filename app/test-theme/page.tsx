import React from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function TestThemePage() {
  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Theme Toggle Test</h1>
      <div className="flex items-center gap-4">
        <span>Theme Toggle:</span>
        <ThemeToggle />
      </div>
      <p className="mt-4 text-sm text-gray-600">
        If you can see the theme toggle button above, it&apos;s working correctly. The button should
        show a sun icon (light mode), moon icon (dark mode), or laptop icon (system mode).
      </p>
    </div>
  );
}
