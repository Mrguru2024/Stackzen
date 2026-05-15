'use client';

import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui';

export default function BlogEditorPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title || !summary || !content || !author) {
      setError('All fields are required.');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      router.push('/blog');
    }, 1000);
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Blog Post</CardTitle>
          <CardDescription>
            Share your insights, tips, or updates with the StackZen community.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="title" className="mb-1 block font-medium">
                Title
              </label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div>
              <label htmlFor="summary" className="mb-1 block font-medium">
                Summary
              </label>
              <Input
                id="summary"
                value={summary}
                onChange={e => setSummary(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div>
              <label htmlFor="content" className="mb-1 block font-medium">
                Content
              </label>
              <Textarea
                id="content"
                rows={8}
                value={content}
                onChange={e => setContent(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div>
              <label htmlFor="author" className="mb-1 block font-medium">
                Author
              </label>
              <Input
                id="author"
                value={author}
                onChange={e => setAuthor(e.target.value)}
                disabled={submitting}
              />
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/blog')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Publishing...' : 'Publish'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
