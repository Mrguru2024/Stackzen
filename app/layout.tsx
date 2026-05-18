import React from 'react';
import type { Viewport } from 'next';
import { Inter, Sora } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { getServerHtmlThemeClass, getThemePreferenceFromCookies } from '@/lib/theme.server';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { LayoutContent } from './layout-content';
import AppProviders from '@/components/providers/AppProviders';

/** Body: Inter — clear UI copy and data. Headings: Sora — calm, product-facing (see docs/UX-UI). */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

export const metadata = {
  title: 'StackZen',
  description: 'Track what matters. Earn with clarity.',
};

/** Mobile / foldables: correct width, safe areas, pinch-zoom preserved for accessibility. */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [themePreference, htmlThemeClass] = await Promise.all([
    getThemePreferenceFromCookies(),
    getServerHtmlThemeClass(),
  ]);

  return (
    <html
      lang="en"
      className={cn(
        inter.variable,
        sora.variable,
        'min-h-dvh min-w-0 overflow-x-hidden',
        htmlThemeClass
      )}
      suppressHydrationWarning
    >
      <body className={cn('min-h-dvh min-w-0 touch-manipulation bg-background font-sans antialiased')}>
        <AppProviders>
          <ThemeProvider
            attribute="class"
            defaultTheme={themePreference ?? 'system'}
            enableSystem
          >
            <LayoutContent>{children}</LayoutContent>
            <Toaster />
          </ThemeProvider>
        </AppProviders>
      </body>
    </html>
  );
}
