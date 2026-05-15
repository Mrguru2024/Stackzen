import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';
import { ReadableStream } from 'stream/web';
import { MessagePort } from 'worker_threads';
// undici expects TextEncoder in some Jest/jsdom environments — set before loading undici
globalThis.TextEncoder = TextEncoder as unknown as typeof globalThis.TextEncoder;
globalThis.TextDecoder = TextDecoder as unknown as typeof globalThis.TextDecoder;
global.ReadableStream = ReadableStream;
global.MessagePort = MessagePort;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fetch, Headers, Request, Response } = require('undici') as typeof import('undici');

global.fetch = fetch;
global.Headers = Headers;
global.Request = Request;
global.Response = Response;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { NextResponse } = require('next/server');
global.NextResponse = NextResponse;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    accounts: {
      create: jest.fn().mockResolvedValue({
        id: 'acct_123',
        object: 'account',
        business_type: 'individual',
        charges_enabled: true,
        payouts_enabled: true,
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'acct_123',
        object: 'account',
        business_type: 'individual',
        charges_enabled: true,
        payouts_enabled: true,
      }),
    },
    accountLinks: {
      create: jest.fn().mockResolvedValue({
        url: 'https://connect.stripe.com/setup/s/test',
      }),
    },
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_123',
        client_secret: 'pi_123_secret',
        status: 'requires_payment_method',
      }),
    },
  }));
});

// Mock Redis
jest.mock('ioredis', () => {
  class RedisMock {
    constructor() {}
    get() {
      return Promise.resolve(null);
    }
    set() {
      return Promise.resolve('OK');
    }
  }
  return {
    __esModule: true,
    default: RedisMock,
    Redis: RedisMock,
  };
});

// Mock Prisma (preserve runtime enums/constants used across the app)
jest.mock('@prisma/client', () => {
  const actual = jest.requireActual('@prisma/client');
  return {
    ...actual,
    PrismaClient: jest.fn().mockImplementation(() => ({
      $on: jest.fn(),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      account: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      session: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      verificationToken: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    })),
  };
});

// Mock NextAuth
jest.mock('next-auth', () => {
  // Default export: NextAuth(authOptions) => handler(req, res)
  const mockNextAuth = jest.fn((...args) => {
    return function handler(req, res) {
      if (res && typeof res.status === 'function') {
        res.status(200).json({ user: { name: 'Test User' } });
      }
      return { user: { name: 'Test User' } };
    };
  });
  // Common named exports
  return {
    __esModule: true,
    default: mockNextAuth,
    getServerSession: jest.fn().mockResolvedValue({
      user: { id: 'user_123', email: 'test@example.com', name: 'Test User' },
    }),
    getSession: jest.fn().mockResolvedValue({
      user: { id: 'user_123', email: 'test@example.com', name: 'Test User' },
    }),
    signIn: jest.fn().mockResolvedValue({ url: '/api/auth/callback' }),
    signOut: jest.fn().mockResolvedValue({ url: '/' }),
    unstable_getServerSession: jest.fn().mockResolvedValue({
      user: { id: 'user_123', email: 'test@example.com', name: 'Test User' },
    }),
    // Add more named exports as needed
  };
});

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: {},
      asPath: '',
      push: jest.fn(),
      replace: jest.fn(),
    };
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    };
  },
  usePathname() {
    return '';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock @auth/prisma-adapter
jest.mock('@auth/prisma-adapter');

// Mock isows
jest.mock('isows');

// Mock @upstash/redis
jest.mock('@upstash/redis');

// Mock uncrypto
jest.mock('uncrypto');

process.env.NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';

// Suppress console errors for known issues
const originalError = console.error;
console.error = (...args) => {
  /** JSDOM forwards navigation failures here with varying argument shapes */
  const navigationNoise = args.some(arg =>
    String(arg ?? '').includes('Not implemented: navigation')
  );
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
      args[0].includes('Warning: React.createFactory()') ||
      args[0].includes('Warning: Using UNSAFE_'))
  ) {
    return;
  }
  // JSDOM does not implement full navigation; StripeConnectCard sets location.href after onboarding fetch.
  if (navigationNoise) {
    return;
  }
  originalError.call(console, ...args);
};
