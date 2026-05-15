import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

export async function createTestUser() {
  const email = `test-${Date.now()}@example.com`;
  const password = await hash('test-password', 12);

  const user = await prisma.user.create({
    data: {
      email,
      password,
      name: 'Test User',
      role: 'user',
    },
  });

  return user;
}

export async function deleteTestUser(userId: string) {
  await prisma.user.delete({
    where: { id: userId },
  });
}

export async function createTestAdmin() {
  const email = `admin-${Date.now()}@example.com`;
  const password = await hash('test-password', 12);

  const user = await prisma.user.create({
    data: {
      email,
      password,
      name: 'Test Admin',
      role: 'admin',
    },
  });

  return user;
}

export async function createTestDeveloper() {
  const email = `dev-${Date.now()}@example.com`;
  const password = await hash('test-password', 12);

  const user = await prisma.user.create({
    data: {
      email,
      password,
      name: 'Test Developer',
      role: 'developer',
    },
  });

  return user;
}

export async function cleanupTestData() {
  // Delete all test users
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: '@example.com',
      },
    },
  });

  // Delete all test feedback
  await prisma.feedback.deleteMany({
    where: {
      user: {
        email: {
          contains: '@example.com',
        },
      },
    },
  });
}
