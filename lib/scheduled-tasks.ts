/**
 * Account deletion reminders and cleanup.
 *
 * The current Prisma schema does not include soft-delete fields on `User` or the
 * legacy `DeletionReminder` / `Goal` / `Challenge` / `Settings` models this file
 * previously referenced. Re-implement when your deletion flow and schema align.
 */
export async function sendDeletionReminders(): Promise<void> {
  return;
}

export async function cleanupDeletedAccounts(): Promise<void> {
  return;
}
