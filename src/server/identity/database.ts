import 'server-only'

import { Pool, type PoolClient, type QueryResultRow } from 'pg'

import { getIdentityConfig } from '@/server/identity/config'

const globalIdentityDatabase = globalThis as unknown as {
  identityPool?: Pool
}

function createPool() {
  const config = getIdentityConfig()
  return new Pool({
    connectionString: config.IDENTITY_DATABASE_URL,
    max: config.IDENTITY_DB_POOL_SIZE,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    application_name: 'qts-identity-platform',
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: true }
        : undefined,
  })
}

export function getIdentityPool() {
  const pool = globalIdentityDatabase.identityPool ?? createPool()
  if (process.env.NODE_ENV !== 'production') {
    globalIdentityDatabase.identityPool = pool
  }
  return pool
}

async function begin(client: PoolClient) {
  await client.query('BEGIN')
  await client.query("SET LOCAL statement_timeout = '10s'")
  await client.query("SET LOCAL lock_timeout = '3s'")
  await client.query("SET LOCAL idle_in_transaction_session_timeout = '15s'")
}

export async function setTenantContext(client: PoolClient, tenantId: string) {
  await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId])
}

export async function withPlatformTransaction<T>(
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getIdentityPool().connect()
  try {
    await begin(client)
    const result = await operation(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * Runs a platform-wide read/write transaction. The flag is set only after
 * the server has verified a platform-admin JWT; RLS policies use it to make
 * the elevated scope explicit instead of relying on the database role to
 * bypass RLS.
 */
export async function withPlatformAdminTransaction<T>(
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  return withPlatformTransaction(async (client) => {
    await client.query("SELECT set_config('app.platform_admin', 'true', true)")
    return operation(client)
  })
}

export async function withTenantTransaction<T>(
  tenantId: string,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  return withPlatformTransaction(async (client) => {
    await setTenantContext(client, tenantId)
    return operation(client)
  })
}

export async function queryIdentity<T extends QueryResultRow>(
  text: string,
  values: readonly unknown[] = [],
) {
  return getIdentityPool().query<T>(text, [...values])
}
