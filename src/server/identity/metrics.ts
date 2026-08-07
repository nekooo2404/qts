import 'server-only'

import { timingSafeEqual } from 'node:crypto'

import { getIdentityConfig } from '@/server/identity/config'
import { getIdentityPool } from '@/server/identity/database'
import { getIdentityRedis } from '@/server/identity/cache'

const CONTENT_TYPE = 'text/plain; version=0.0.4; charset=utf-8'

function metric(name: string, value: number) {
  return `${name} ${Number.isFinite(value) ? value : 0}`
}

function hasMetricsAccess(request: Request) {
  const configuredToken = getIdentityConfig().IDENTITY_METRICS_TOKEN
  if (!configuredToken) return process.env.NODE_ENV !== 'production'
  const provided = request.headers.get('x-identity-metrics-token') ?? ''
  const expected = Buffer.from(configuredToken)
  const actual = Buffer.from(provided)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export async function renderIdentityMetrics(request: Request) {
  if (!hasMetricsAccess(request)) {
    return new Response('metrics authentication required\n', {
      status: 401,
      headers: { 'content-type': CONTENT_TYPE },
    })
  }

  let databaseUp = 1
  let redisUp = 1
  try {
    await getIdentityPool().query('SELECT 1')
  } catch {
    databaseUp = 0
  }
  try {
    await (await getIdentityRedis()).ping()
  } catch {
    redisUp = 0
  }

  const body = [
    '# HELP qts_identity_up Identity platform process availability.',
    '# TYPE qts_identity_up gauge',
    metric('qts_identity_up', databaseUp && redisUp ? 1 : 0),
    '# HELP qts_identity_database_up PostgreSQL connectivity.',
    '# TYPE qts_identity_database_up gauge',
    metric('qts_identity_database_up', databaseUp),
    '# HELP qts_identity_redis_up Redis connectivity.',
    '# TYPE qts_identity_redis_up gauge',
    metric('qts_identity_redis_up', redisUp),
    '# HELP qts_identity_process_uptime_seconds Process uptime.',
    '# TYPE qts_identity_process_uptime_seconds gauge',
    metric('qts_identity_process_uptime_seconds', process.uptime()),
    '# HELP qts_identity_nodejs_heap_used_bytes Node.js heap used.',
    '# TYPE qts_identity_nodejs_heap_used_bytes gauge',
    metric(
      'qts_identity_nodejs_heap_used_bytes',
      process.memoryUsage().heapUsed,
    ),
    '',
  ].join('\n')

  return new Response(body, {
    status: databaseUp && redisUp ? 200 : 503,
    headers: { 'content-type': CONTENT_TYPE, 'cache-control': 'no-store' },
  })
}
