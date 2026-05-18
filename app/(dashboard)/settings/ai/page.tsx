import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/lib/auth';
import AiPersonalization from '@/components/ai-personalization';

export default async function SettingsAiPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=%2Fsettings%2Fai');
  }

  return <AiPersonalization />;
}
