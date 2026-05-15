import { NextResponse } from 'next/server';

export interface BlogPostDto {
  id: string;
  title: string;
  summary: string;
  author: string;
  date: string;
  url: string;
}

export interface BlogResponse {
  posts: BlogPostDto[];
  hasData: boolean;
  generatedAt: string;
}

/**
 * Production-ready endpoint for the StackZen blog feed.
 *
 * The CMS integration is owned by the marketing team and surfaced via
 * `BLOG_FEED_URL`. When the env var is unset (e.g. local development before
 * the CMS is provisioned) the endpoint returns an empty list so the UI can
 * render an authentic empty state instead of placeholder copy.
 */
export async function GET() {
  const feedUrl = process.env.BLOG_FEED_URL;

  if (!feedUrl) {
    return NextResponse.json<BlogResponse>({
      posts: [],
      hasData: false,
      generatedAt: new Date().toISOString(),
    });
  }

  try {
    const upstream = await fetch(feedUrl, {
      next: { revalidate: 300 },
      headers: { accept: 'application/json' },
    });
    if (!upstream.ok) {
      throw new Error(`Blog feed responded ${upstream.status}`);
    }
    const json = (await upstream.json()) as { posts?: unknown };
    const rawPosts = Array.isArray(json.posts) ? json.posts : [];
    const posts: BlogPostDto[] = rawPosts
      .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object')
      .map(p => {
        const id = String(p.id ?? '');
        const title = String(p.title ?? '');
        const summary = String(p.summary ?? p.excerpt ?? '');
        const author = String(p.author ?? p.byline ?? 'StackZen Team');
        const date = String(p.date ?? p.publishedAt ?? new Date().toISOString());
        const url = String(p.url ?? p.link ?? `/blog/${id}`);
        return { id, title, summary, author, date, url };
      })
      .filter(p => p.id && p.title);

    return NextResponse.json<BlogResponse>({
      posts,
      hasData: posts.length > 0,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[BLOG_FEED]', error);
    return NextResponse.json<BlogResponse>({
      posts: [],
      hasData: false,
      generatedAt: new Date().toISOString(),
    });
  }
}
