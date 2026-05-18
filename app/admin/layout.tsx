import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-config';
import { assertAdminPageAccess } from '@/lib/security/admin-access';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  const access = await assertAdminPageAccess(session.user.id);
  if (!access.ok) {
    if (access.reason === 'mfa_required') {
      redirect('/settings/security?adminMfa=required');
    }
    if (access.reason === 'session_idle') {
      redirect('/login?reason=admin_idle');
    }
    redirect('/dashboard');
  }

  return <>{children}</>;
}
