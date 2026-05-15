import fs from 'fs';

const files = [
  'app/api/dashboard/activity/route.ts',
  'app/api/dashboard/stats/route.ts',
  'app/api/dashboard/summary/route.ts',
  'app/api/expense/summary/route.ts',
  'app/api/goals/progress/route.ts',
  'app/api/income/chart/route.ts',
  'app/api/income/route.ts',
  'app/api/income/summary/route.ts',
];

const old = `class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}`;

const neu = `class APIError extends Error {
  readonly statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
  }
}`;

for (const f of files) {
  const c = fs.readFileSync(f, 'utf8');
  if (!c.includes(old)) {
    console.error('pattern not found', f);
    continue;
  }
  fs.writeFileSync(f, c.replace(old, neu));
  console.log('ok', f);
}
