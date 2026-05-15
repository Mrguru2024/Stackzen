'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Card } from '@/components/ui/card';

interface OnboardingData {
  income: number;
  allocation: {
    needs: number;
    wants: number;
    savings: number;
  };
  goals: string[];
  bankConnected: boolean;
}

interface OnboardingDataCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
}

export function OnboardingDataCard({
  title,
  description,
  icon,
  className = '',
}: OnboardingDataCardProps) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-start gap-4">
        {icon && <div className="mt-1">{icon}</div>}
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Card>
  );
}

OnboardingDataCard.displayName = 'OnboardingDataCard';

export default OnboardingDataCard;
