'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Textarea } from '@/components/ui';
import { Label } from '@/components/ui/label';
import { Star, CheckCircle, ThumbsUp } from 'lucide-react';

interface SessionRatingFormProps {
  sessionId: string;
  mentorName: string;
  onRatingSubmitted: () => void;
}

export default function SessionRatingForm({
  sessionId,
  mentorName,
  onRatingSubmitted,
}: SessionRatingFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please provide a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/mentors/sessions/${sessionId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          feedback,
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        onRatingSubmitted();
      } else {
        throw new Error('Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="p-6 text-center">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h3 className="mb-2 text-xl font-bold">Thank You!</h3>
          <p className="mb-4 text-gray-600">
            Your feedback has been submitted. It helps us improve and helps other users find great
            mentors.
          </p>
          <Button onClick={() => (window.location.href = '/mentors')}>Find More Mentors</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="text-center">Rate Your Session</CardTitle>
        <p className="text-center text-gray-600">How was your session with {mentorName}?</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Star Rating */}
        <div className="text-center">
          <Label className="mb-3 block text-sm font-medium">Overall Rating</Label>
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingChange(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="text-2xl focus:outline-none"
                title={`Rate ${star} star${star > 1 ? 's' : ''}`}
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoverRating || rating)
                      ? 'fill-current text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very Good'}
            {rating === 5 && 'Excellent'}
          </p>
        </div>

        {/* Quick Feedback */}
        <div>
          <Label className="mb-3 block text-sm font-medium">Quick Feedback</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              'Very helpful',
              'Good communication',
              'Knowledgeable',
              'Professional',
              'Worth the money',
              'Would recommend',
              'Clear explanations',
              'Patient and understanding',
            ].map(feedback => (
              <Button
                key={feedback}
                variant="outline"
                size="sm"
                className="h-auto py-2 text-xs"
                onClick={() => {
                  if (!feedback.includes(feedback)) {
                    setFeedback(prev => (prev ? `${prev}, ${feedback}` : feedback));
                  }
                }}
              >
                <ThumbsUp className="mr-1 h-3 w-3" />
                {feedback}
              </Button>
            ))}
          </div>
        </div>

        {/* Detailed Feedback */}
        <div>
          <Label htmlFor="feedback" className="mb-3 block text-sm font-medium">
            Additional Comments (Optional)
          </Label>
          <Textarea
            id="feedback"
            placeholder="Share your experience, suggestions, or any specific feedback..."
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            rows={4}
          />
        </div>

        {/* Submit Button */}
        <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0} className="w-full">
          {isSubmitting ? 'Submitting...' : 'Submit Rating'}
        </Button>
      </CardContent>
    </Card>
  );
}
