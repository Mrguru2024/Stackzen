'use client';

import React from 'react';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MessageSquare, Star, User } from 'lucide-react';
import { useFinancialMentorship } from '@/hooks/useFinancialMentorship';
import Image from 'next/image';

interface FinancialMentorshipProps {
  userId: string;
}

export default function FinancialMentorship({ userId }: FinancialMentorshipProps) {
  const { data, loading, error, bookSession } = useFinancialMentorship();
  const [selectedMentor, setSelectedMentor] = useState<(typeof data.mentors)[0] | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div
          role="status"
          className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Error loading mentorship data</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const handleBooking = async () => {
    if (!selectedMentor || !selectedDate || !selectedTime) return;

    const success = await bookSession({
      mentorId: selectedMentor.id,
      date: selectedDate,
      time: selectedTime,
    });

    if (success) {
      // Reset form
      setSelectedDate('');
      setSelectedTime('');
      setSelectedMentor(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
          Financial Mentorship
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Connect with experienced financial mentors to guide your journey to financial success.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Mentors List */}
        <div className="space-y-4 lg:col-span-2">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Available Mentors
          </h2>
          {data.mentors.map((mentor, index) => (
            <motion.div
              key={mentor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-lg border p-6 ${
                selectedMentor?.id === mentor.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              } cursor-pointer transition-colors hover:border-blue-500`}
              onClick={() => setSelectedMentor(mentor)}
            >
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-700">
                  {mentor.avatar && (
                    <Image
                      src={mentor.avatar}
                      alt={mentor.name}
                      className="h-full w-full rounded-full object-cover"
                      width={64}
                      height={64}
                      title={mentor.name}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-white">{mentor.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {mentor.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {mentor.specialization}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{mentor.sessionsCompleted} sessions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{mentor.studentsHelped} students</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Booking Section */}
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Book a Session
          </h2>
          {selectedMentor ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  min={new Date().toISOString().split('T')[0]}
                  title="Select a date"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Time
                </label>
                <label htmlFor="mentor-time-select" className="sr-only">
                  Select a time
                </label>
                <select
                  id="mentor-time-select"
                  value={selectedTime}
                  onChange={e => setSelectedTime(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  title="Select a time"
                >
                  <option value="">Select a time</option>
                  {data.availableTimeSlots.map(slot => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleBooking}
                disabled={!selectedDate || !selectedTime}
                className="w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Book Session
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400">
              Select a mentor to book a session
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
