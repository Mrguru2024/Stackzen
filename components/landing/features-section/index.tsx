import React from 'react';
import Image from 'next/image';

import {
  BarChart3,
  CreditCard,
  PiggyBank,
  Receipt,
  Shield,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react';

const features = [
  {
    icon: Wallet,
    title: 'Smart Budgeting',
    description:
      'Create personalized budgets that adapt to your spending patterns and financial goals.',
  },
  {
    icon: BarChart3,
    title: 'Expense Analytics',
    description:
      'Get detailed insights into your spending habits with beautiful visualizations and reports.',
  },
  {
    icon: PiggyBank,
    title: 'Automated Savings',
    description:
      'Set up smart rules to automatically save money based on your income and spending patterns.',
  },
  {
    icon: Target,
    title: 'Goal Tracking',
    description:
      'Set financial goals and track your progress with interactive milestones and celebrations.',
  },
  {
    icon: CreditCard,
    title: 'Bill Management',
    description: 'Never miss a payment with automated bill tracking and smart payment reminders.',
  },
  {
    icon: Receipt,
    title: 'Receipt Scanner',
    description: 'Scan and categorize receipts automatically with our AI-powered receipt scanner.',
  },
  {
    icon: TrendingUp,
    title: 'Investment Insights',
    description:
      'Get personalized investment recommendations based on your risk profile and goals.',
  },
  {
    icon: Shield,
    title: 'Security First',
    description: 'Bank-level security with end-to-end encryption and multi-factor authentication.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to manage your finances
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Our comprehensive suite of tools helps you take control of your financial future with
            confidence.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(feature => (
            <div
              key={feature.title}
              className="group relative rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <feature.icon className="mb-4 h-8 w-8 text-primary" />
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Feature highlight */}
        <div className="mt-20 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-8 lg:p-12">
              <h3 className="mb-4 text-2xl font-bold">AI-Powered Financial Insights</h3>
              <p className="mb-6 text-gray-600">
                Our advanced AI analyzes your spending patterns and provides personalized
                recommendations to help you save more and spend smarter.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <p className="ml-3 text-gray-600">Smart categorization of expenses</p>
                </li>
                <li className="flex items-start">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <p className="ml-3 text-gray-600">Personalized saving recommendations</p>
                </li>
                <li className="flex items-start">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <p className="ml-3 text-gray-600">Predictive spending insights</p>
                </li>
              </ul>
            </div>
            <div className="flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-8 lg:p-12">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg shadow-lg">
                <Image
                  src="/images/dashboard-preview.png"
                  alt="Dashboard Preview"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
