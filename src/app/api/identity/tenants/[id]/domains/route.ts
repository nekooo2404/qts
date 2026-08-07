import { randomUUID } from 'node:crypto'

import {
  identityErrorResponse,
  parseIdentityUuid,
  readIdentityJson,
} from '@backend/server/identity/http'
import { requirePlatformAdministrator } from '@backend/server/identity/keycloak'
import { createTenantDomainSchema } from '@backend/server/identity/schemas'
import {
  createTenantDomain,
  listTenantDomains,
} from '@backend/server/identity/tenant-service'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: RouteContext) {
  try {
    await requirePlatformAdministrator(request)
    const tenantId = parseIdentityUuid((await context.params).id, 'tenant id')
    return Response.json({ data: await listTenantDomains(tenantId) })
  } catch (error) {
    return identityErrorResponse(error)
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const principal = await requirePlatformAdministrator(request)
    const tenantId = parseIdentityUuid((await context.params).id, 'tenant id')
    const input = await readIdentityJson(request, createTenantDomainSchema)
    const domain = await createTenantDomain(tenantId, input.hostname, {
      actorSubject: principal.subject,
      requestId: request.headers.get('x-request-id') ?? randomUUID(),
    })
    return Response.json({ data: domain }, { status: 201 })
  } catch (error) {
    return identityErrorResponse(error)
  }
}
