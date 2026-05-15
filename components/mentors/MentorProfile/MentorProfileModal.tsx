'use client';
import Image from 'next/image';
import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge, Button, Textarea } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Award, BadgeCheck, CheckCircle, Clock, Globe, Star, Users } from 'lucide-react';
import { type Mentor } from '../MentorDirectory/MentorCard';

interface MentorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentor: Mentor;
  onBooked?: () => void;
}

const MentorProfileModal: React.FC<MentorProfileModalProps> = ({ isOpen, onClose, mentor, onBooked }) => {
  const { toast } = useToast();
  const [selectedSessionType, setSelectedSessionType] = useState<'stackzen' | 'direct'>('stackzen');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [goals, setGoals] = useState('');
  const [struggles, setStruggles] = useState('');
  const [preferredTopics, setPreferredTopics] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stackzenPrice = 65;
  const directPrice = useMemo(() => Math.max(mentor.hourlyRate * (duration / 60), 15), [duration, mentor.hourlyRate]);

  const submitBooking = async () => {
    if (!bookingDate || !bookingTime) {
      toast({ title: 'Date and time required', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const scheduledAt = new Date(`${bookingDate}T${bookingTime}`).toISOString();
      const payload = {
        mentorId: mentor.id,
        sessionType: selectedSessionType === 'stackzen' ? 'STACKZEN_SESSION' : 'DIRECT_BOOKING',
        scheduledAt,
        duration: selectedSessionType === 'stackzen' ? 30 : duration,
        price: selectedSessionType === 'stackzen' ? stackzenPrice : directPrice,
        goals,
        struggles,
        preferredTopics,
      };

      const response = await fetch('/api/mentors/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorData?.error ?? 'Unable to create booking');
      }

      toast({
        title: 'Session booked',
        description: 'Your mentorship session has been scheduled successfully.',
      });
      onBooked?.();
      onClose();
    } catch (error) {
      toast({
        title: 'Booking failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Mentor Profile & Booking</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-start gap-6">
            <Image
              src={mentor.headshotUrl || '/avatars/default.jpg'}
              alt={mentor.name}
              width={96}
              height={96}
              className="h-24 w-24 rounded-full border-4 border-primary object-cover"
            />
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <h2 className="text-2xl font-bold">{mentor.name}</h2>
                {mentor.isCertified && <BadgeCheck className="h-5 w-5 text-green-500" />}
                {mentor.isVerified && <CheckCircle className="h-5 w-5 text-blue-500" />}
              </div>
              <p className="mb-3 text-gray-600 dark:text-gray-300">{mentor.bio}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400" />
                  {mentor.rating.toFixed(1)} ({mentor.totalSessions} sessions)
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {mentor.yearsOfExperience} years experience
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  {mentor.languages.join(', ')}
                </span>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Specialties
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {mentor.specialties.map(specialty => (
                <Badge key={specialty} variant="secondary">
                  {specialty}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Book Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Button
                  variant={selectedSessionType === 'stackzen' ? 'default' : 'outline'}
                  onClick={() => setSelectedSessionType('stackzen')}
                >
                  StackZen Session (${stackzenPrice})
                </Button>
                <Button
                  variant={selectedSessionType === 'direct' ? 'default' : 'outline'}
                  onClick={() => setSelectedSessionType('direct')}
                >
                  Direct Booking (${directPrice.toFixed(2)})
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="booking-date">Preferred Date</Label>
                  <Input
                    id="booking-date"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingDate}
                    onChange={event => setBookingDate(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="booking-time">Preferred Time</Label>
                  <Input
                    id="booking-time"
                    type="time"
                    value={bookingTime}
                    onChange={event => setBookingTime(event.target.value)}
                  />
                </div>
              </div>

              {selectedSessionType === 'direct' && (
                <div>
                  <Label htmlFor="booking-duration">Duration (minutes)</Label>
                  <Input
                    id="booking-duration"
                    type="number"
                    min={30}
                    max={180}
                    step={30}
                    value={duration}
                    onChange={event => setDuration(Number.parseInt(event.target.value || '30', 10))}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="booking-goals">Goals</Label>
                <Textarea
                  id="booking-goals"
                  rows={3}
                  placeholder="What do you want to accomplish?"
                  value={goals}
                  onChange={event => setGoals(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="booking-struggles">Current Challenges</Label>
                <Textarea
                  id="booking-struggles"
                  rows={3}
                  placeholder="What are you currently struggling with?"
                  value={struggles}
                  onChange={event => setStruggles(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="booking-topics">Preferred Topics</Label>
                <Textarea
                  id="booking-topics"
                  rows={2}
                  placeholder="Budgeting, investing, debt payoff, etc."
                  value={preferredTopics}
                  onChange={event => setPreferredTopics(event.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={submitBooking} disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? 'Booking...' : 'Confirm Booking'}
                </Button>
                <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MentorProfileModal;
