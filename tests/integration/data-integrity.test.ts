import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

describe('Data Integrity Tests', () => {
  // Test data
  const testUser = {
    email: 'test@example.com',
    password: 'testpassword123',
  };

  // Clean up before each test
  beforeEach(async () => {
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
  });

  // Clean up after all tests
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('User data consistency between Supabase and Prisma', async () => {
    // Create user in Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
    });

    expect(authError).toBeNull();
    expect(authData.user).toBeTruthy();

    // Verify user in Prisma
    const dbUser = await prisma.user.findUnique({
      where: { email: testUser.email },
    });

    expect(dbUser).toBeTruthy();
    expect(dbUser?.email).toBe(testUser.email);
  });

  test('Income data integrity', async () => {
    // Create test income
    const income = await prisma.income.create({
      data: {
        amount: 5000,
        source: 'Salary',
        frequency: 'MONTHLY',
        user: {
          create: {
            email: testUser.email,
            password: testUser.password,
          },
        },
      },
    });

    // Verify income data
    const savedIncome = await prisma.income.findUnique({
      where: { id: income.id },
    });

    expect(savedIncome).toBeTruthy();
    expect(savedIncome?.amount).toBe(5000);
    expect(savedIncome?.source).toBe('Salary');
  });

  test('Expense data integrity', async () => {
    // Create test expense
    const expense = await prisma.expense.create({
      data: {
        amount: 1000,
        category: 'NEEDS',
        description: 'Rent',
        user: {
          create: {
            email: testUser.email,
            password: testUser.password,
          },
        },
      },
    });

    // Verify expense data
    const savedExpense = await prisma.expense.findUnique({
      where: { id: expense.id },
    });

    expect(savedExpense).toBeTruthy();
    expect(savedExpense?.amount).toBe(1000);
    expect(savedExpense?.category).toBe('NEEDS');
  });

  test('Quote data integrity', async () => {
    // Create test quote
    const quote = await prisma.quote.create({
      data: {
        amount: 2000,
        service: 'Consulting',
        status: 'DRAFT',
        user: {
          create: {
            email: testUser.email,
            password: testUser.password,
          },
        },
      },
    });

    // Verify quote data
    const savedQuote = await prisma.quote.findUnique({
      where: { id: quote.id },
    });

    expect(savedQuote).toBeTruthy();
    expect(savedQuote?.amount).toBe(2000);
    expect(savedQuote?.service).toBe('Consulting');
  });

  test('Data backup and restore', async () => {
    // Create test data
    const user = await prisma.user.create({
      data: {
        email: testUser.email,
        password: testUser.password,
        income: {
          create: {
            amount: 5000,
            source: 'Salary',
            frequency: 'MONTHLY',
          },
        },
        expenses: {
          create: {
            amount: 1000,
            category: 'NEEDS',
            description: 'Rent',
          },
        },
      },
      include: {
        income: true,
        expenses: true,
      },
    });

    // Simulate backup
    const backup = {
      user,
      timestamp: new Date(),
    };

    // Simulate data loss
    await prisma.user.delete({
      where: { id: user.id },
    });

    // Verify data is gone
    const deletedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    expect(deletedUser).toBeNull();

    // Simulate restore
    const restoredUser = await prisma.user.create({
      data: {
        email: backup.user.email,
        password: backup.user.password,
        income: {
          create: backup.user.income,
        },
        expenses: {
          create: backup.user.expenses,
        },
      },
      include: {
        income: true,
        expenses: true,
      },
    });

    // Verify restored data
    expect(restoredUser).toBeTruthy();
    expect(restoredUser.email).toBe(backup.user.email);
    expect(restoredUser.income[0].amount).toBe(backup.user.income[0].amount);
    expect(restoredUser.expenses[0].amount).toBe(backup.user.expenses[0].amount);
  });
});
