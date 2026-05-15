import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/api/require-admin';

export async function GET() {
  const { response } = await requireAdminSession();
  if (response) return response;

  try {
    const token = process.env.VERCEL_TOKEN;
    const project = process.env.VERCEL_PROJECT;
    const team = process.env.VERCEL_TEAM;
    if (!token || !project) {
      return NextResponse.json({ error: 'Missing Vercel env vars' }, { status: 500 });
    }
    const teamParam = team ? `&teamId=${team}` : '';
    const url = `https://api.vercel.com/v6/deployments?projectId=${project}${teamParam}&limit=10`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch Vercel deployments' }, { status: 500 });
    }
    const data = await res.json();
    const deployments = (data.deployments || []).map((d: Record<string, unknown>) => ({
      id: d.uid,
      url: d.url ? `https://${d.url}` : '',
      state: d.state,
      createdAt: d.createdAt,
      meta: d.meta,
      commit: (d.meta as { githubCommitSha?: string } | undefined)?.githubCommitSha || '',
      commitMessage: (d.meta as { githubCommitMessage?: string } | undefined)?.githubCommitMessage || '',
      author:
        (d.creator as { username?: string } | undefined)?.username ||
        (d.meta as { githubCommitAuthorName?: string } | undefined)?.githubCommitAuthorName ||
        '',
    }));
    return NextResponse.json({ deployments });
  } catch {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
