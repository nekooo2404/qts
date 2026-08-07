import { getIdentityRedis } from '@backend/server/identity/cache'
import { isIdentityPlatformConfigured } from '@backend/server/identity/config'
import { queryIdentity } from '@backend/server/identity/database'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isIdentityPlatformConfigured()) {
    return Response.json(
      {
        status: 'not_configured',
        components: { database: 'unknown', redis: 'unknown' },
      },
      { status: 503 },
    )
  }

  const [database, redis] = await Promise.allSettled([
    queryIdentity('SELECT 1'),
    getIdentityRedis().then((client) => client.ping()),
  ])
  const healthy =
    database.status === 'fulfilled' && redis.status === 'fulfilled'

  return Response.json(
    {
      status: healthy ? 'ok' : 'degraded',
      components: {
        database: database.status === 'fulfilled' ? 'ok' : 'error',
        redis: redis.status === 'fulfilled' ? 'ok' : 'error',
      },
    },
    { status: healthy ? 200 : 503 },
  )
}
