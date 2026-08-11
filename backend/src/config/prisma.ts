import { PrismaClient } from '@prisma/client';
import { env } from './env';

/**
 * A single shared PrismaClient instance.
 *
 * It is cached on `globalThis` so that `tsx watch` hot reloads during
 * development do not open a new connection pool on every file change.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isProduction || env.isTest ? ['error'] : ['warn', 'error'],
  });

if (!env.isProduction) {
  globalForPrisma.prisma = prisma;
}

export const disconnectPrisma = async (): Promise<void> => {
  await prisma.$disconnect();
};
