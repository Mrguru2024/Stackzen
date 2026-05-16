'use client';
import Image from 'next/image';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui';
import {
  Calendar,
  Clock,
  MessageCircle,
  ArrowLeft,
  CreditCard,
  Video,
  ChevronRight,
} from 'lucide-react';
import { Mentor } from '../MentorDirectory/MentorCard';

interface BookingFlowMobileProps {
  mentor: Mentor;
  sessionType: 'stackzen' | 'direct';
  onBack: () => void;
  onComplete: (bookingData: any) => void;
}

export default function BookingFlowMobile({
  mentor,
  sessionType,
  onBack,
  onComplete,
}: BookingFlowMobileProps) {
  const [step, setStep] = useState(1);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [duration, setDuration] = useState(30);

  const stackzenPrice = 65;
  const directPrice = mentor.hourlyRate * (30 / 60);

  const handleInputChange = (field: string, value: string | number) => {
    if (field === 'date') setBookingDate(String(value));
    else if (field === 'time') setBookingTime(String(value));
    else if (field === 'duration') {
      const n = typeof value === 'number' ? value : parseInt(String(value), 10);
      setDuration(Number.isFinite(n) ? n : 30);
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  const handleSubmit = () => {
    onComplete({
      mentor,
      sessionType,
      price: sessionType === 'stackzen' ? stackzenPrice : directPrice,
    });
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-xl font-bold">Schedule Session</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Choose when you want to meet with {mentor.name}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={bookingDate}
            onChange={e => handleInputChange('date', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div>
          <Label htmlFor="time">Time</Label>
          <Input
            id="time"
            type="time"
            value={bookingTime}
            onChange={e => handleInputChange('time', e.target.value)}
          />
        </div>
        {sessionType === 'direct' && (
          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min="30"
              max="180"
              step="30"
              value={duration}
              onChange={e => handleInputChange('duration', parseInt(e.target.value, 10))}
            />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={handleBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleNext} className="flex-1">
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-xl font-bold">Your Goals</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Help {mentor.name} understand what you want to achieve
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="goals">What are your main financial goals?</Label>
          <Textarea
            id="goals"
            placeholder="e.g., Save for a house, pay off debt, start investing..."
            onChange={e => handleInputChange('goals', e.target.value)}
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="struggles">What challenges are you facing?</Label>
          <Textarea
            id="struggles"
            placeholder="e.g., Living paycheck to paycheck, not knowing where to start..."
            onChange={e => handleInputChange('struggles', e.target.value)}
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="topics">What topics should we focus on?</Label>
          <Textarea
            id="topics"
            placeholder="e.g., Budgeting, debt management, investment strategies..."
            onChange={e => handleInputChange('topics', e.target.value)}
            rows={2}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={handleBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleNext} className="flex-1">
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-xl font-bold">Review & Pay</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Confirm your session details and complete payment
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Mentor Info */}
            <div className="flex items-center gap-3">
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

            {/* Session Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date
                </span>
                <span>
                  {bookingDate
                    ? new Date(`${bookingDate}T12:00:00`).toLocaleDateString()
                    : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Time
                </span>
                <span>{bookingTime || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Duration
                </span>
                <span>{sessionType === 'direct' ? duration : 30} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Type
                </span>
                <Badge variant={sessionType === 'stackzen' ? 'default' : 'outline'}>
                  {sessionType === 'stackzen' ? 'StackZen Session' : 'Direct Booking'}
                </Badge>
              </div>
            </div>

            {/* Price */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Total Price:</span>
                <span className="text-2xl font-bold text-primary">
                  ${sessionType === 'stackzen' ? stackzenPrice : directPrice.toFixed(2)}
                </span>
              </div>
              {sessionType === 'stackzen' && (
                <p className="mt-1 text-sm text-gray-600">
                  Includes 30-minute session, video call, and follow-up resources
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={handleBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleSubmit} className="flex-1">
          <CreditCard className="mr-2 h-4 w-4" />
          Pay Now
        </Button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      {/* Progress Indicator */}
      <div className="mb-6">
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
                  className={`mx-2 h-1 w-8 ${step > stepNumber ? 'bg-primary' : 'bg-gray-200'}`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>Schedule</span>
          <span>Goals</span>
          <span>Pay</span>
        </div>
      </div>

      {/* Step Content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </div>
  );
}
