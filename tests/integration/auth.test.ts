import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

describe('Authentication Integration Tests', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'testpassword123',
    name: 'Test User',
  };

  beforeEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('User registration flow', async () => {
    // Create user
    const user = await prisma.user.create({
      data: {
        email: testUser.email,
        name: testUser.name,
        hashedPassword: await hash(testUser.password, 12),
      },
    });

    expect(user).toBeTruthy();
    expect(user.email).toBe(testUser.email);
    expect(user.name).toBe(testUser.name);
  });

  test('Password reset flow', async () => {
    // Create user
    const user = await prisma.user.create({
      data: {
        email: testUser.email,
        name: testUser.name,
        hashedPassword: await hash(testUser.password, 12),
      },
    });

    // Create password reset token
    const resetToken = await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: 'test-token',
        expires: new Date(Date.now() + 3600000), // 1 hour from now
      },
    });

    expect(resetToken).toBeTruthy();
    expect(resetToken.userId).toBe(user.id);
    expect(resetToken.used).toBe(false);
  });

  test('User settings creation on registration', async () => {
    // Create user
    const user = await prisma.user.create({
      data: {
        email: testUser.email,
        name: testUser.name,
        hashedPassword: await hash(testUser.password, 12),
        settings: {
          create: {
            currency: 'USD',
            language: 'en',
            timezone: 'UTC',
            theme: 'system',
          },
        },
      },
      include: {
        settings: true,
      },
    });

    expect(user.settings).toBeTruthy();
    expect(user.settings?.currency).toBe('USD');
    expect(user.settings?.language).toBe('en');
  });
});
