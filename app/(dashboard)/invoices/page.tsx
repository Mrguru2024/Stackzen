import { redirect } from 'next/navigation';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InvoicesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  for (const [key, val] of Object.entries(sp)) {
    if (val === undefined) continue;
    if (typeof val === 'string') q.set(key, val);
    else for (const v of val) q.append(key, v);
  }
  const suffix = q.toString() ? `?${q.toString()}` : '';
  redirect(`/income/invoices${suffix}`);
}
