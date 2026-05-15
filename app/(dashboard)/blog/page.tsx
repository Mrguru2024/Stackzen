'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { format } from 'date-fns';

interface BlogPost {
  id: string;
  title: string;
  summary: string;
  author: string;
  date: string;
  url: string;
}

interface BlogResponse {
  posts: BlogPost[];
  hasData: boolean;
  generatedAt: string;
}

export default function BlogPage() {
  const query = useQuery<BlogResponse, Error>({
    queryKey: ['blog', 'posts'],
    queryFn: async () => {
      const res = await fetch('/api/blog', { credentials: 'same-origin' });
      if (!res.ok) {
        throw new Error(`Failed to load blog (${res.status})`);
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="mx-auto w-full max-w-4xl py-8 pt-16 sm:pt-0">
      <div className="mb-8 flex flex-col gap-4 pb-8 pt-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
          <p className="text-muted-foreground">Insights, tips, and updates from StackZen</p>
        </div>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <Button asChild className="gap-2">
            <Link href="/blog/new">New Post</Link>
          </Button>
        </div>
      </div>

      {query.isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : query.error ? (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">{query.error.message}</CardContent>
        </Card>
      ) : !query.data || query.data.posts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No blog posts have been published yet. Check back soon for new content from the
            StackZen team.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {query.data.posts.map(post => (
            <Card key={post.id} className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <CardTitle>
                  <Link
                    href={post.url || `/blog/${post.id}`}
                    className="text-primary hover:underline"
                  >
                    {post.title}
                  </Link>
                </CardTitle>
                <CardDescription>{post.summary}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{post.author}</span>
                <span>{format(new Date(post.date), 'PPP')}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
