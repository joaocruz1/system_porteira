// src/lib/prisma.ts
import { PrismaClient } from '@/generated/prisma'; // <--- LINHA CORRIGIDA

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}