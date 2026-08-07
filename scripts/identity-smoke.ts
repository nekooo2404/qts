import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

import { Pool } from 'pg'
import { createClient } from 'redis'

const databaseUrl = process.env.IDENTITY_DATABASE_URL
const redisUrl = process.env.REDIS_URL

if (!databaseUrl || !redisUrl) {
  throw new Error('IDENTITY_DATABASE_URL and REDIS_URL are required.')
}

const pool = new Pool({ connectionString: databaseUrl, max: 1 })
const redis = createClient({ url: redisUrl })
const suffix = randomUUID().slice(0, 8)

async function verifyTenantIsolation() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const tenants = await client.query<{ id: string }>(
      `INSERT INTO identity.tenants (key, name, status)
       VALUES ($1, $2, 'ACTIVE'), ($3, $4, 'ACTIVE')
       RETURNING id`,
      [
        `smoke-a-${suffix}`,
        `Smoke Tenant A ${suffix}`,
        `smoke-b-${suffix}`,
        `Smoke Tenant B ${suffix}`,
      ],
    )
    const tenantA = tenants.rows[0]?.id
    const tenantB = tenants.rows[1]?.id
    assert.ok(tenantA && tenantB)

    await client.query("SELECT set_config('app.tenant_id', $1, true)", [
      tenantA,
    ])
    await client.query(
      `INSERT INTO identity.tenant_domains
        (tenant_id, hostname, verification_token_hash)
       VALUES ($1, $2, $3)`,
      [tenantA, `a-${suffix}.example.test`, `hash-a-${suffix}`],
    )

    await client.query("SELECT set_config('app.tenant_id', $1, true)", [
      tenantB,
    ])
    await client.query(
      `INSERT INTO identity.tenant_domains
        (tenant_id, hostname, verification_token_hash)
       VALUES ($1, $2, $3)`,
      [tenantB, `b-${suffix}.example.test`, `hash-b-${suffix}`],
    )

    await client.query("SELECT set_config('app.tenant_id', $1, true)", [
      tenantA,
    ])
    const visibleToA = await client.query<{ tenant_id: string }>(
      'SELECT tenant_id FROM identity.tenant_domains ORDER BY hostname',
    )
    assert.equal(visibleToA.rowCount, 1)
    assert.equal(visibleToA.rows[0]?.tenant_id, tenantA)

    await client.query("SELECT set_config('app.tenant_id', $1, true)", [
      tenantB,
    ])
    const visibleToB = await client.query<{ tenant_id: string }>(
      'SELECT tenant_id FROM identity.tenant_domains ORDER BY hostname',
    )
    assert.equal(visibleToB.rowCount, 1)
    assert.equal(visibleToB.rows[0]?.tenant_id, tenantB)
  } finally {
    await client.query('ROLLBACK')
    client.release()
  }
}

async function verifyRedis() {
  await redis.connect()
  assert.equal(await redis.ping(), 'PONG')
  const key = `identity:smoke:${suffix}`
  await redis.set(key, 'ok', { EX: 30 })
  assert.equal(await redis.get(key), 'ok')
  await redis.del(key)
}

try {
  await verifyTenantIsolation()
  await verifyRedis()
  console.log('Identity PostgreSQL RLS and Redis smoke checks passed.')
} finally {
  if (redis.isOpen) await redis.quit()
  await pool.end()
}
