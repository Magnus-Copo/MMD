import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Disable referential integrity for MongoDB standalone (no replica set)
  // This allows basic operations without transactions
  __internal: {
    engine: {
      connection_limit: 10
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
