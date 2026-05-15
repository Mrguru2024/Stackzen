import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

describe('Finance System Integration Tests', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'testpassword123',
    name: 'Test User',
  };

  let userId: string;

  beforeEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: testUser.email,
        name: testUser.name,
        hashedPassword: await hash(testUser.password, 12),
        settings: {
          create: {
            currency: 'USD',
            allocationNeeds: 40,
            allocationWants: 30,
            allocationSavings: 30,
          },
        },
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('Income creation and allocation', async () => {
    // Create income
    const income = await prisma.income.create({
      data: {
        amount: 5000,
        source: 'Salary',
        frequency: 'MONTHLY',
        startDate: new Date(),
        userId,
      },
    });

    expect(income).toBeTruthy();
    expect(income.amount).toBe(5000);
    expect(income.source).toBe('Salary');

    // Verify allocation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { settings: true },
    });

    expect(user?.settings?.allocationNeeds).toBe(40);
    expect(user?.settings?.allocationWants).toBe(30);
    expect(user?.settings?.allocationSavings).toBe(30);
  });

  test('Expense creation and categorization', async () => {
    // Create expense
    const expense = await prisma.expense.create({
      data: {
        amount: 100,
        category: 'Groceries',
        description: 'Weekly groceries',
        date: new Date(),
        userId,
        tags: ['food', 'necessities'],
      },
    });

    expect(expense).toBeTruthy();
    expect(expense.amount).toBe(100);
    expect(expense.category).toBe('Groceries');
    expect(expense.tags).toContain('food');
  });

  test('Spending guardrail creation and tracking', async () => {
    // Create spending guardrail
    const guardrail = await prisma.spendingGuardrail.create({
      data: {
        category: 'Groceries',
        limit: 500,
        period: 'MONTHLY',
        userId,
      },
    });

    expect(guardrail).toBeTruthy();
    expect(guardrail.limit).toBe(500);
    expect(guardrail.current).toBe(0);

    // Add expense and verify tracking
    await prisma.expense.create({
      data: {
        amount: 100,
        category: 'Groceries',
        description: 'Weekly groceries',
        date: new Date(),
        userId,
      },
    });

    const updatedGuardrail = await prisma.spendingGuardrail.findUnique({
      where: { id: guardrail.id },
    });

    expect(updatedGuardrail?.current).toBe(100);
  });
});

describe('Income API', () => {
  it('should return income summary for authenticated user', async () => {
    const res = await fetch('/api/income/summary', {
      headers: { Authorization: 'Bearer test-token' },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('totalIncome');
    expect(data).toHaveProperty('activeClients');
  });

  it('should return 401 for unauthenticated summary request', async () => {
    const res = await fetch('/api/income/summary');
    expect(res.status).toBe(401);
  });

  it('should return income chart for authenticated user', async () => {
    const res = await fetch('/api/income/chart', {
      headers: { Authorization: 'Bearer test-token' },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('labels');
    expect(data).toHaveProperty('datasets');
  });

  it('should return 401 for unauthenticated chart request', async () => {
    const res = await fetch('/api/income/chart');
    expect(res.status).toBe(401);
  });

  it('should return income list for authenticated user', async () => {
    const res = await fetch('/api/income/list', {
      headers: { Authorization: 'Bearer test-token' },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should return 401 for unauthenticated list request', async () => {
    const res = await fetch('/api/income/list');
    expect(res.status).toBe(401);
  });
});
