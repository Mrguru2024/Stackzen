import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/api/require-admin';

export async function GET() {
  const { response } = await requireAdminSession();
  if (response) return response;

  try {
    const token = process.env.SENTRY_TOKEN;
    const org = process.env.SENTRY_ORG;
    const project = process.env.SENTRY_PROJECT;
    if (!token || !org || !project) {
      return NextResponse.json({ error: 'Missing Sentry env vars' }, { status: 500 });
    }
    const issuesRes = await fetch(
      `https://sentry.io/api/0/projects/${org}/${project}/issues/?limit=10`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const issues = issuesRes.ok ? await issuesRes.json() : [];
    const releasesRes = await fetch(
      `https://sentry.io/api/0/projects/${org}/${project}/releases/?per_page=5`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const releases = releasesRes.ok ? await releasesRes.json() : [];
    return NextResponse.json({ issues, releases });
  } catch {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
