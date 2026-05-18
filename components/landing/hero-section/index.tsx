import React from 'react';
import Image from 'next/image';

import Link from 'next/link';
import { PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui';

interface FeatureTag {
  text: string;
  icon: string;
}

const featureTags: FeatureTag[] = [
  { text: '40/30/30 Method', icon: '💰' },
  { text: 'Gig Income Tools', icon: '🛠️' },
  { text: 'Bank Connection', icon: '🏦' },
  { text: 'No Credit Card', icon: '✅' },
];

export function HeroSection() {
  return (
    <section
      role="region"
      className="relative flex flex-col items-center justify-between overflow-hidden border-b border-border/60 bg-gradient-to-br from-background via-primary/[0.06] to-background px-4 py-12 dark:via-primary/10 md:flex-row md:px-8 md:py-16"
    >
      {/* Decorative Elements */}
      <div className="absolute -right-[50px] -top-[150px] h-[300px] w-[300px] rounded-full bg-primary/10 dark:bg-primary/20" />
      <div className="absolute -bottom-[100px] left-[10%] h-[200px] w-[200px] rounded-full bg-emerald-500/10 dark:bg-emerald-400/15" />

      {/* Content Container */}
      <div className="relative z-10 w-full pr-0 text-center md:w-[45%] md:pr-8 md:text-left">
        {/* Logo for branding */}
        <div className="mb-6 flex justify-center md:justify-start">
          <Image
            src="/Full size.svg"
            alt="StackZen Logo"
            width={80}
            height={80}
            className="h-16 w-auto drop-shadow-lg md:h-20"
          />
        </div>
        <h2 className="mb-6 font-heading text-heading-xl font-semibold">
          Take Control of Your Income with the{' '}
          <span className="bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent dark:to-emerald-400">
            40/30/30 Split
          </span>
        </h2>

        <p className="mb-8 font-sans text-body-xl font-normal text-muted-foreground">
          The smart financial platform built for service providers and gig workers to track income,
          maximize earnings, and build wealth through the proven 40/30/30 method.
        </p>

        {/* CTA Buttons */}
        <div className="mb-8 flex flex-wrap justify-center gap-3 md:justify-start">
          <Button size="lg" className="shadow-md shadow-primary/20" asChild>
            <Link href="/register" className="!text-primary-foreground no-underline hover:!text-primary-foreground/90">
              Start for free
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="border-primary/40 bg-background/80 backdrop-blur-sm" asChild>
            <Link
              href="#income-split"
              className="inline-flex items-center gap-2 !text-foreground no-underline hover:!text-foreground/90"
            >
              <PlayCircle className="h-5 w-5 shrink-0" aria-hidden />
              Watch demo
            </Link>
          </Button>
        </div>

        {/* Feature Tags */}
        <div className="flex flex-wrap justify-center gap-3 md:justify-start">
          {featureTags.map(tag => (
            <div
              key={tag.text}
              className="flex items-center rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm"
            >
              <span className="mr-1.5">{tag.icon}</span>
              {tag.text}
            </div>
          ))}
        </div>
      </div>

      {/* Hero Image */}
      <div className="mt-12 w-full max-w-[600px] md:mt-0 md:w-1/2">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-card shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
          {/* Mock Dashboard UI */}
          <div className="flex h-full w-full flex-col">
            <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
              <div className="font-bold">StackZen Dashboard</div>
              <div className="h-8 w-8 rounded-full bg-primary-foreground/25" />
            </div>
            <div className="flex-1 p-4">
              <div className="mb-4 h-4 w-3/4 rounded bg-muted" />
              <div className="mb-4 h-4 w-1/2 rounded bg-muted" />
              <div className="h-4 w-2/3 rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
