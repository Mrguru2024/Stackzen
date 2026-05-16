'use client';

import React from 'react';

import Image from 'next/image';
import { Star } from 'lucide-react';

const testimonials = [
  {
    content:
      'StackZen has completely transformed how I manage my finances. The automated savings features have helped me save more than I ever thought possible.',
    author: 'Sarah Johnson',
    role: 'Marketing Director',
    rating: 5,
    image: '/testimonials/sarah.jpg',
  },
  {
    content:
      "The AI insights are incredibly accurate. It's like having a financial advisor in your pocket. I've made better financial decisions thanks to StackZen.",
    author: 'Michael Chen',
    role: 'Software Engineer',
    rating: 5,
    image: '/testimonials/michael.jpg',
  },
  {
    content:
      'I love how easy it is to track my spending and set financial goals. The interface is beautiful and intuitive. Highly recommended!',
    author: 'Emily Rodriguez',
    role: 'Small Business Owner',
    rating: 5,
    image: '/testimonials/emily.jpg',
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Loved by thousands of users
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Don&apos;t just take our word for it. Here&apos;s what our users have to say about their
            experience with StackZen.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map(testimonial => (
            <div key={testimonial.author} className="rounded-xl bg-white p-8 shadow-sm">
              <div className="mb-4 flex items-center">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="mb-6 text-gray-600">
                &quot;{testimonial.content}&quot;
              </blockquote>
              <div className="flex items-center">
                <Image
                  src={testimonial.image}
                  alt={testimonial.author}
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                />
                <div className="ml-4">
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-16">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">4.9/5</div>
              <p className="mt-2 text-sm text-gray-600">App Store Rating</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">10K+</div>
              <p className="mt-2 text-sm text-gray-600">Active Users</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">$2M+</div>
              <p className="mt-2 text-sm text-gray-600">Saved by Users</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">99.9%</div>
              <p className="mt-2 text-sm text-gray-600">Uptime</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
