import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { canAccessMetRepairsCommandCenter } from '@/lib/integrations/met-repairs/access';
import { getMetRepairsApiUrl, isMetRepairsConfigured } from '@/lib/integrations/met-repairs/config';
import { MetRepairsIntegrationSettings } from '@/components/settings/met-repairs-integration/MetRepairsIntegrationSettings';

export default async function MetRepairsIntegrationSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login?callbackUrl=%2Fsettings%2Fintegrations%2Fmet-repairs');
  }
  if (!canAccessMetRepairsCommandCenter(session.user.role)) {
    redirect('/settings');
  }

  return (
    <MetRepairsIntegrationSettings
      configured={isMetRepairsConfigured()}
      apiUrl={getMetRepairsApiUrl()}
    />
  );
}
