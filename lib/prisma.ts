import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function prismaLogLevels(): Array<'query' | 'info' | 'warn' | 'error'> {
  if (process.env.NODE_ENV === 'production') {
    return ['warn', 'error'];
  }
  if (process.env.PRISMA_LOG_QUERIES === 'true') {
    return ['query', 'info', 'warn', 'error'];
  }
  return ['warn', 'error'];
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: prismaLogLevels(),
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
