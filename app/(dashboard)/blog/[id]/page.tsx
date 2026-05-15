import React from 'react';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';

const blogPosts = [
  {
    id: '1',
    title: 'Welcome to the StackZen Blog',
    summary: 'Discover financial tips, product updates, and community stories.',
    author: 'StackZen Team',
    date: new Date('2024-06-01'),
    content:
      'Welcome to the official StackZen blog! Here you will find the latest updates, financial tips, and inspiring stories from our community. Stay tuned for more!',
  },
  {
    id: '2',
    title: 'How to Master the 40/30/30 Rule',
    summary: 'A practical guide to budgeting for needs, investments, and savings.',
    author: 'Alex Mentor',
    date: new Date('2024-06-10'),
    content:
      'The 40/30/30 rule is a simple way to budget your income: 40% for needs, 30% for investments, and 30% for savings. In this post, we break down how to apply it in your daily life.',
  },
];

export default async function BlogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const post = blogPosts.find(p => p.id === resolvedParams.id);
  if (!post) return notFound();

  return (
    <div className="mx-auto w-full max-w-2xl py-8 pt-16 sm:pt-0">
      <Card>
        <CardHeader>
          <CardTitle className="mb-2 text-2xl font-bold">{post.title}</CardTitle>
          <CardDescription className="mb-2">{post.summary}</CardDescription>
          <div className="mb-2 flex items-center gap-4 text-sm text-muted-foreground">
            <span>{post.author}</span>
            <span>{format(post.date, 'PPP')}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none">{post.content}</div>
        </CardContent>
      </Card>
    </div>
  );
}
