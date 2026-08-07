import 'server-only'

import { createClient, type RedisClientType } from 'redis'

import { getIdentityConfig } from '@backend/server/identity/config'

type RedisState = {
  client?: RedisClientType
  connection?: Promise<RedisClientType>
}

const globalIdentityRedis = globalThis as unknown as {
  identityRedis?: RedisState
}

const state = globalIdentityRedis.identityRedis ?? {}
if (process.env.NODE_ENV !== 'production') {
  globalIdentityRedis.identityRedis = state
}

export async function getIdentityRedis(): Promise<RedisClientType> {
  if (state.client?.isReady) return state.client
  if (state.connection) return state.connection

  const client = createClient({ url: getIdentityConfig().REDIS_URL })
  client.on('error', (error) => {
    console.error('Identity Redis connection error.', error)
  })

  state.client = client
  state.connection = client.connect().then(() => client)

  try {
    return await state.connection
  } finally {
    state.connection = undefined
  }
}

export async function getCachedJson<T>(key: string): Promise<T | null> {
  const value = await (await getIdentityRedis()).get(key)
  if (!value) return null
  return JSON.parse(value) as T
}

export async function consumeCachedJson<T>(key: string): Promise<T | null> {
  const client = await getIdentityRedis()
  const value = await client.getDel(key)
  if (!value) return null
  return JSON.parse(value) as T
}

export async function setCachedJson(
  key: string,
  value: unknown,
  ttlSeconds: number,
) {
  await (
    await getIdentityRedis()
  ).set(key, JSON.stringify(value), {
    EX: ttlSeconds,
  })
}

export async function deleteCachedKeys(keys: string[]) {
  if (!keys.length) return
  await (await getIdentityRedis()).del(keys)
}

export async function consumeDistributedRateLimit(input: {
  key: string
  limit: number
  windowMs: number
}) {
  const client = await getIdentityRedis()
  const result = (await client.eval(
    `
      local current = redis.call('INCR', KEYS[1])
      if current == 1 then
        redis.call('PEXPIRE', KEYS[1], ARGV[1])
      end
      local ttl = redis.call('PTTL', KEYS[1])
      return { current, ttl }
    `,
    {
      keys: [`identity:rate:${input.key}`],
      arguments: [String(input.windowMs)],
    },
  )) as [number, number]

  const [count, ttlMs] = result
  return {
    allowed: count <= input.limit,
    remaining: Math.max(0, input.limit - count),
    retryAfterSeconds: Math.max(1, Math.ceil(ttlMs / 1000)),
  }
}
