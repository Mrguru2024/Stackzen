import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

import Link from 'next/link';
import { PlayCircle, PlayCircle } from 'lucide-react';

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
      className="relative flex flex-col items-center justify-between overflow-hidden bg-gradient-to-br from-white via-[#f0f9f0] to-white px-4 py-12 md:flex-row md:px-8 md:py-16"
    >
      {/* Decorative Elements */}
      <div className="absolute -right-[50px] -top-[150px] h-[300px] w-[300px] rounded-full bg-[#4CAF50]/5" />
      <div className="absolute -bottom-[100px] left-[10%] h-[200px] w-[200px] rounded-full bg-[#2196F3]/5" />

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
          <span className="bg-gradient-to-r from-[#4CAF50] to-[#2196F3] bg-clip-text text-transparent">
            40/30/30 Split
          </span>
        </h2>

        <p className="mb-8 font-sans text-body-xl font-normal text-gray-600">
          The smart financial platform built for service providers and gig workers to track income,
          maximize earnings, and build wealth through the proven 40/30/30 method.
        </p>

        {/* CTA Buttons */}
        <div className="mb-8 flex flex-wrap justify-center gap-4 md:justify-start">
          <Link
            href="/register"
            className="rounded-md bg-[#4CAF50] px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#4CAF50]/20 transition-all hover:-translate-y-0.5 hover:bg-[#43A047] hover:shadow-xl"
          >
            Start For Free
          </Link>

          <button className="flex items-center rounded-md border border-[#2196F3] bg-white px-7 py-3.5 text-base font-semibold text-[#2196F3] transition-colors hover:bg-[#2196F3]/5">
            <PlayCircle className="mr-2 h-5 w-5" />
            Watch Demo
          </button>
        </div>

        {/* Feature Tags */}
        <div className="flex flex-wrap justify-center gap-3 md:justify-start">
          {featureTags.map(tag => (
            <div
              key={tag.text}
              className="flex items-center rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-sm font-medium"
            >
              <span className="mr-1.5">{tag.icon}</span>
              {tag.text}
            </div>
          ))}
        </div>
      </div>

      {/* Hero Image */}
      <div className="mt-12 w-full max-w-[600px] md:mt-0 md:w-1/2">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
          {/* Mock Dashboard UI */}
          <div className="flex h-full w-full flex-col">
            <div className="flex items-center justify-between bg-[#4CAF50] p-4 text-white">
              <div className="font-bold">Stackr Dashboard</div>
              <div className="h-8 w-8 rounded-full bg-white/30" />
            </div>
            <div className="flex-1 p-4">
              <div className="mb-4 h-4 w-3/4 rounded bg-gray-100" />
              <div className="mb-4 h-4 w-1/2 rounded bg-gray-100" />
              <div className="h-4 w-2/3 rounded bg-gray-100" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
