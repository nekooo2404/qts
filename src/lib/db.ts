import 'server-only'

import path from 'node:path'

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

import { PrismaClient } from '@/generated/prisma/client'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL chưa được cấu hình.')
}

const configuredDatabaseUrl: string = databaseUrl

const globalForPrisma = globalThis as unknown as {
  qtsPrisma?: PrismaClient
}

function createPrismaClient() {
  const adapterUrl = configuredDatabaseUrl.startsWith('file:./')
    ? `file:${path.resolve(process.cwd(), 'prisma', configuredDatabaseUrl.slice(7)).replaceAll('\\', '/')}`
    : configuredDatabaseUrl
  const adapter = new PrismaBetterSqlite3({ url: adapterUrl })

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

export const db = globalForPrisma.qtsPrisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.qtsPrisma = db
}
