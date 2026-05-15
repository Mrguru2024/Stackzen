import { prisma } from '@/lib/prisma';
import { sendDeletionNotification } from '@/lib/email';
import { differenceInDays } from 'date-fns';

const REMINDER_DAYS = [7, 3, 1]; // Send reminders 7, 3, and 1 day before deletion

export async function sendDeletionReminders() {
  try {
    // Get all users in deletion grace period
    const usersToRemind = await prisma.user.findMany({
      where: {
        deletedAt: { not: null },
        deletionDate: { gt: new Date() },
      },
      select: {
        id: true,
        email: true,
        name: true,
        deletionDate: true,
      },
    });

    for (const user of usersToRemind) {
      const daysRemaining = differenceInDays(user.deletionDate as Date, new Date());

      // Check if we should send a reminder based on the remaining days
      if (REMINDER_DAYS.includes(daysRemaining)) {
        await sendDeletionNotification(user.email, user.name || 'User', user.deletionDate as Date);

        // Log the reminder sent
        await prisma.deletionReminder.create({
          data: {
            userId: user.id,
            sentAt: new Date(),
            daysRemaining,
          },
        });
      }
    }
  } catch (error) {
    throw error;
  }
}

export async function cleanupDeletedAccounts() {
  try {
    // Find all users whose deletion date has passed
    const expiredUsers = await prisma.user.findMany({
      where: {
        deletedAt: { not: null },
        deletionDate: { lte: new Date() },
      },
      select: {
        id: true,
      },
    });

    // Permanently delete expired accounts and their data
    for (const user of expiredUsers) {
      await prisma.$transaction([
        // Delete user's data
        prisma.expense.deleteMany({
          where: { userId: user.id },
        }),
        prisma.income.deleteMany({
          where: { userId: user.id },
        }),
        prisma.goal.deleteMany({
          where: { userId: user.id },
        }),
        prisma.challenge.deleteMany({
          where: { userId: user.id },
        }),
        prisma.settings.deleteMany({
          where: { userId: user.id },
        }),
        prisma.deletionReminder.deleteMany({
          where: { userId: user.id },
        }),
        // Finally, delete the user
        prisma.user.delete({
          where: { id: user.id },
        }),
      ]);
    }
  } catch (error) {
    throw error;
  }
}
