import { redirect } from 'next/navigation';

/**
 * Legacy passive notifications surface — canonical operational queue lives at Operational Center.
 */
export default function LegacyNotificationsRedirect() {
  redirect('/operational-center');
}
