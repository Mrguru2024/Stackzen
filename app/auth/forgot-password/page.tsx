import { redirect } from 'next/navigation';

/** Old path; real page is `app/(auth)/forgot-password` → `/forgot-password`. */
export default function ForgotPasswordLegacyRedirect() {
  redirect('/forgot-password');
}
