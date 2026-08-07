import { randomUUID } from 'node:crypto'

import { consumeDistributedRateLimit } from '@backend/server/identity/cache'
import {
  identityErrorResponse,
  readIdentityJson,
} from '@backend/server/identity/http'
import { requirePlatformAdministrator } from '@backend/server/identity/keycloak'
import { createTenantSchema } from '@backend/server/identity/schemas'
import {
  createTenant,
  listTenants,
} from '@backend/server/identity/tenant-service'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    await requirePlatformAdministrator(request)
    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1)
    const pageSize = Math.min(
      100,
      Math.max(1, Number(url.searchParams.get('pageSize') ?? 20) || 20),
    )
    return Response.json(await listTenants({ page, pageSize }))
  } catch (error) {
    return identityErrorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const principal = await requirePlatformAdministrator(request)
    const rateLimit = await consumeDistributedRateLimit({
      key: `tenant-create:${principal.subject}`,
      limit: 20,
      windowMs: 60_000,
    })
    if (!rateLimit.allowed) {
      return Response.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many tenant creation requests.',
          },
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
        },
      )
    }

    const input = await readIdentityJson(request, createTenantSchema)
    const requestId = request.headers.get('x-request-id') ?? randomUUID()
    const tenant = await createTenant(input, {
      actorSubject: principal.subject,
      requestId,
    })
    return Response.json({ data: tenant }, { status: 201 })
  } catch (error) {
    return identityErrorResponse(error)
  }
}
