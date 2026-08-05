type RateLimitRecord = {
  count: number
  resetAt: number
}

type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSeconds: number }

const globalRateLimit = globalThis as unknown as {
  qtsRateLimitStore?: Map<string, RateLimitRecord>
}

const store =
  globalRateLimit.qtsRateLimitStore ?? new Map<string, RateLimitRecord>()

if (process.env.NODE_ENV !== 'production') {
  globalRateLimit.qtsRateLimitStore = store
}

function pruneExpired(now: number) {
  if (store.size < 500) {
    return
  }

  for (const [key, record] of store) {
    if (record.resetAt <= now) {
      store.delete(key)
    }
  }
}

export function consumeRateLimit(
  key: string,
  options: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now()
  pruneExpired(now)

  const current = store.get(key)
  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + options.windowMs })
    return { allowed: true, remaining: options.limit - 1 }
  }

  if (current.count >= options.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    }
  }

  current.count += 1
  store.set(key, current)
  return { allowed: true, remaining: options.limit - current.count }
}

export function clearRateLimit(key: string) {
  store.delete(key)
}
