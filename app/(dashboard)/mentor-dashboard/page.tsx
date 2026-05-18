import { redirect } from 'next/navigation';

/** Legacy route — mentor hub lives in the dedicated portal. */
export default function MentorDashboardRedirectPage() {
  redirect('/mentor-portal/dashboard');
}
