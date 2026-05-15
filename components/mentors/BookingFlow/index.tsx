'use client';
import Image from 'next/image';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { Mentor } from '../MentorDirectory/MentorCard';

interface BookingFlowProps {
  mentor: Mentor;
  sessionType: 'stackzen' | 'direct';
  onBack: () => void;
  onComplete: () => void;
}

const BookingFlow: React.FC<BookingFlowProps> = ({ mentor, sessionType, onBack, onComplete }) => {
  const [step, setStep] = useState(1);

  const stackzenPrice = 65;
  const _directPrice = mentor.hourlyRate * (30 / 60);

  const _handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const _handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  const _handleSubmit = () => {
    onComplete();
  };

  const _renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold">Schedule Your Session</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Choose a date and time that works for you
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="date">Preferred Date</Label>
          <Input id="date" type="date" min={new Date().toISOString().split('T')[0]} />
        </div>
        <div>
          <Label htmlFor="time">Preferred Time</Label>
          <Input id="time" type="time" />
        </div>
      </div>

      {sessionType === 'direct' && (
        <div>
          <Label htmlFor="duration">Session Duration (minutes)</Label>
          <Input id="duration" type="number" min="30" max="180" step="30" />
        </div>
      )}

      <div className="flex gap-4">
        <Button variant="outline" onClick={_handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={_handleNext} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );

  const _renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold">Tell Us About Your Goals</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Help us understand what you want to achieve
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="goals">What are your main financial goals?</Label>
          <Textarea
            id="goals"
            placeholder="e.g., Save for a house down payment, pay off credit card debt, start investing..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="struggles">What are your biggest financial challenges?</Label>
          <Textarea
            id="struggles"
            placeholder="e.g., Living paycheck to paycheck, not knowing where to start with investing..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="topics">What topics would you like to focus on?</Label>
          <Textarea
            id="topics"
            placeholder="e.g., Budgeting, debt management, investment strategies, retirement planning..."
            rows={2}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" onClick={_handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={_handleNext} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );

  const _renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold">Review & Confirm</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Review your booking details before proceeding to payment
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Image
              src={mentor.headshotUrl || '/avatars/default.jpg'}
              alt={mentor.name}
              width={48}
              height={48}
              className="h-12 w-12 rounded-full"
            />
            <div>
              <h3 className="font-semibold">{mentor.name}</h3>
              <p className="text-sm text-gray-600">{mentor.specialties.join(', ')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Date:</span>
              <p className="font-medium">{new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-gray-500">Time:</span>
              <p className="font-medium">{new Date().toLocaleTimeString()}</p>
            </div>
            <div>
              <span className="text-gray-500">Duration:</span>
              <p className="font-medium">30 minutes</p>
            </div>
            <div>
              <span className="text-gray-500">Type:</span>
              <p className="font-medium">
                {sessionType === 'stackzen' ? 'StackZen Session' : 'Direct Booking'}
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Total Price:</span>
              <span className="text-2xl font-bold text-primary">
                ${sessionType === 'stackzen' ? stackzenPrice : _directPrice.toFixed(2)}
              </span>
            </div>
            {sessionType === 'stackzen' && (
              <p className="mt-1 text-sm text-gray-600">
                Includes 30-minute session, video call, and follow-up resources
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button variant="outline" onClick={_handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={_handleSubmit} className="flex-1">
          <CreditCard className="mr-2 h-4 w-4" />
          Proceed to Payment
        </Button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map(stepNumber => (
            <div key={stepNumber} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  step >= stepNumber ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {stepNumber}
              </div>
              {stepNumber < 3 && (
                <div
                  className={`mx-2 h-1 w-16 ${step > stepNumber ? 'bg-primary' : 'bg-gray-200'}`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>Schedule</span>
          <span>Goals</span>
          <span>Review</span>
        </div>
      </div>

      {/* Step Content */}
      {step === 1 && _renderStep1()}
      {step === 2 && _renderStep2()}
      {step === 3 && _renderStep3()}
    </div>
  );
};

export default BookingFlow;
