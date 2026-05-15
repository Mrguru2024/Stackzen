'use client';

import React from 'react';

import Image from 'next/image';
import { Icons } from '@/components/ui/icons';
import { motion } from 'framer-motion';

const features = [
  'Custom income allocation with 40/30/30 split',
  'Bank account integration with Plaid',
  'Goal tracking with progress visualization',
  'AI-powered financial advice',
  'Expense categorization and budget planning',
  'Real-time financial insights and analytics',
];

export function HeroSection() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 p-8 text-white lg:w-1/2 lg:p-12"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center justify-center"
        >
          <Image
            src="/Full size.svg"
            alt="StackZen Logo"
            width={420}
            height={120}
            className="mb-0"
          />
        </motion.div>

        <div className="space-y-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="mb-6 bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-5xl font-bold leading-tight text-transparent">
              Take control of your financial future
            </h1>
            <p
              className="mb-8 text-xl leading-relaxed !text-white !opacity-100"
              style={{ textShadow: '0 1px 8px rgba(0,0,0,0.18)' }}
            >
              Track your income, plan your expenses, and achieve your financial goals with StackZen
              - the ultimate tool for service providers.
            </p>
          </motion.div>

          <div className="space-y-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center space-x-4 rounded-xl bg-white/10 p-4 backdrop-blur-sm transition-colors duration-200 hover:bg-white/20"
              >
                <Icons.check className="h-6 w-6 flex-shrink-0 text-emerald-200" />
                <span className="text-lg text-white">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
