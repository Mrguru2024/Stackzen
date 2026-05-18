'use client';

import React from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

const panelOrbTransition = {
  duration: 7,
  repeat: Infinity,
  ease: 'easeInOut' as const,
};

const logoFloatTransition = {
  duration: 4,
  repeat: Infinity,
  ease: 'easeInOut' as const,
};

interface WinHighlight {
  mark: React.ReactNode;
  title: string;
  description: string;
}

/** StackZen 40 / 30 / 30 split — product-specific visual */
function Split403030Mark() {
  return (
    <svg viewBox="0 0 56 56" className="h-14 w-14 shrink-0" aria-hidden>
      <rect x="4" y="8" width="48" height="11" rx="3" fill="#047857" />
      <rect x="4" y="23" width="36" height="11" rx="3" fill="#059669" />
      <rect x="4" y="38" width="36" height="11" rx="3" fill="#10b981" />
      <text x="8" y="17" fill="#fff" fontSize="7" fontWeight="700" fontFamily="system-ui,sans-serif">
        40%
      </text>
      <text x="8" y="32" fill="#fff" fontSize="7" fontWeight="700" fontFamily="system-ui,sans-serif">
        30%
      </text>
      <text x="8" y="47" fill="#fff" fontSize="7" fontWeight="700" fontFamily="system-ui,sans-serif">
        30%
      </text>
    </svg>
  );
}

/** Goal progress ring — matches StackZen goals UI language */
function GoalProgressMark() {
  return (
    <svg viewBox="0 0 56 56" className="h-14 w-14 shrink-0" aria-hidden>
      <circle cx="28" cy="28" r="22" fill="none" stroke="#d1fae5" strokeWidth="5" />
      <circle
        cx="28"
        cy="28"
        r="22"
        fill="none"
        stroke="#059669"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="110 138"
        transform="rotate(-90 28 28)"
      />
      <circle cx="28" cy="10" r="3" fill="#047857" />
    </svg>
  );
}

/** Multiple income streams in one view */
function IncomeStreamsMark() {
  return (
    <svg viewBox="0 0 56 56" className="h-14 w-14 shrink-0" aria-hidden>
      <rect x="6" y="12" width="44" height="9" rx="2" fill="#a7f3d0" />
      <rect x="6" y="12" width="30" height="9" rx="2" fill="#059669" />
      <rect x="6" y="26" width="44" height="9" rx="2" fill="#a7f3d0" />
      <rect x="6" y="26" width="22" height="9" rx="2" fill="#10b981" />
      <rect x="6" y="40" width="44" height="9" rx="2" fill="#a7f3d0" />
      <rect x="6" y="40" width="38" height="9" rx="2" fill="#047857" />
    </svg>
  );
}

/** Manual-first, sync when ready — typographic mark */
function PaceMark() {
  return (
    <div
      className="auth-hero-pace-mark flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-emerald-700 px-1"
      aria-hidden
    >
      <span className="text-[9px] font-bold uppercase leading-none text-emerald-900">Now</span>
      <span className="my-0.5 text-xs font-bold text-emerald-700">→</span>
      <span className="text-[9px] font-bold uppercase leading-none text-emerald-900">Sync</span>
    </div>
  );
}

const wins: WinHighlight[] = [
  {
    mark: <Split403030Mark />,
    title: 'Payday clarity in minutes',
    description: 'See your 40/30/30 split before you spend—no spreadsheet required.',
  },
  {
    mark: <GoalProgressMark />,
    title: 'Goals that feel achievable',
    description: 'Track progress in plain language and celebrate every milestone.',
  },
  {
    mark: <IncomeStreamsMark />,
    title: 'Made for variable income',
    description: 'Gig, freelance, and W-2 in one calm view—your hustle, organized.',
  },
  {
    mark: <PaceMark />,
    title: 'Add bank sync when you want',
    description: 'Start simple today; connect accounts later, on your timeline.',
  },
];

export function HeroSection() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45 }}
      className="auth-hero-panel relative flex w-full flex-col justify-center overflow-hidden px-6 py-10 lg:w-1/2 lg:px-10 lg:py-12"
    >
      {/* Light sweep across the panel */}
      {!reduceMotion && (
        <div
          aria-hidden
          className="auth-hero-shimmer pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-transparent via-white/25 to-transparent"
        />
      )}

      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-16 z-0 h-72 w-72 rounded-full bg-emerald-300/40 blur-3xl"
        animate={
          reduceMotion
            ? undefined
            : { opacity: [0.5, 0.85, 0.5], scale: [1, 1.15, 1], x: [0, -12, 0] }
        }
        transition={panelOrbTransition}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-16 z-0 h-80 w-80 rounded-full bg-teal-200/35 blur-3xl"
        animate={
          reduceMotion
            ? undefined
            : { opacity: [0.4, 0.75, 0.4], scale: [1, 1.12, 1], x: [0, 20, 0], y: [0, -14, 0] }
        }
        transition={{ ...panelOrbTransition, duration: 9 }}
      />

      <div className="relative z-10 mx-auto w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative mb-8 flex justify-center"
        >
          <motion.div
            className="relative inline-block"
            animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
            transition={logoFloatTransition}
          >
            <motion.div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-[56%] z-0 h-28 w-[14rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50 blur-2xl sm:w-[16rem]"
              animate={
                reduceMotion ? undefined : { opacity: [0.55, 0.9, 0.55], scale: [0.95, 1.06, 0.95] }
              }
              transition={panelOrbTransition}
            />

            {!reduceMotion && (
              <motion.div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-[56%] z-[1] h-24 w-[14rem] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl sm:h-28 sm:w-[16rem]"
              >
                <motion.div
                  className="absolute left-1/2 top-1/2 h-[220%] w-[220%] -translate-x-1/2 -translate-y-1/2"
                  style={{
                    background:
                      'conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.95) 50deg, transparent 110deg, rgba(167,243,208,1) 190deg, transparent 270deg)',
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                />
              </motion.div>
            )}

            <Image
              src="/Full size.svg"
              alt="StackZen Logo"
              width={420}
              height={120}
              className="relative z-10 mb-0"
            />
          </motion.div>
        </motion.div>

        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="auth-hero-badge mx-auto mb-4 flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide"
        >
          Built for freelancers & service pros
        </motion.span>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.35rem]">
            Feel clear and confident every payday
          </h1>
          <div className="auth-hero-lead mt-4 text-base leading-relaxed sm:text-lg">
            StackZen turns your income into a simple plan you can actually follow—so you know
            what&apos;s for bills, growth, and savings without the Sunday-night stress.
          </div>
        </motion.div>

        <ul className="mt-8 space-y-3" aria-label="What you get with StackZen">
          {wins.map((win, index) => (
            <motion.li
              key={win.title}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.28 + index * 0.07 }}
              className={cn(
                'auth-hero-card flex gap-4 rounded-xl border p-4 shadow-md',
                'transition-shadow duration-200 hover:shadow-lg'
              )}
            >
              {win.mark}
              <div className="min-w-0 flex-1">
                <div className="auth-hero-card-title font-semibold leading-snug">{win.title}</div>
                <div className="auth-hero-card-body mt-1 text-sm leading-relaxed">{win.description}</div>
              </div>
            </motion.li>
          ))}
        </ul>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="auth-hero-footnote mt-8 rounded-lg px-4 py-3 text-center text-sm font-medium lg:text-left"
        >
          14-day free trial · No credit card to explore · Start at your pace
        </motion.div>
      </div>
    </motion.div>
  );
}
