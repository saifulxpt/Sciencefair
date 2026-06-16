import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL
  if (!url || url.includes('dummy')) {
    // Return a proxy that throws on actual use but allows import at build time
    return new Proxy({} as PrismaClient, {
      get(_, prop) {
        throw new Error(`PrismaClient not available: DATABASE_URL is not set. Property accessed: ${String(prop)}`)
      }
    })
  }
  return new PrismaClient()
}

export const prisma: PrismaClient =
  (globalForPrisma.prisma ?? createPrismaClient()) as PrismaClient

if (process.env.NODE_ENV !== 'production') {
  const url = process.env.DATABASE_URL
  if (url && !url.includes('dummy')) {
    globalForPrisma.prisma = prisma
  }
}
