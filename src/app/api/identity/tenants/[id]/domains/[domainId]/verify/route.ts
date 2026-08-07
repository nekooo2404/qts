import { randomUUID } from 'node:crypto'

import {
  identityErrorResponse,
  parseIdentityUuid,
  readIdentityJson,
} from '@/server/identity/http'
import { requirePlatformAdministrator } from '@/server/identity/keycloak'
import { verifyTenantDomainSchema } from '@/server/identity/schemas'
import { verifyTenantDomain } from '@/server/identity/tenant-service'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string; domainId: string }>
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const principal = await requirePlatformAdministrator(request)
    const params = await context.params
    const tenantId = parseIdentityUuid(params.id, 'tenant id')
    const domainId = parseIdentityUuid(params.domainId, 'domain id')
    const input = await readIdentityJson(request, verifyTenantDomainSchema)
    const domain = await verifyTenantDomain(tenantId, domainId, input.token, {
      actorSubject: principal.subject,
      requestId: request.headers.get('x-request-id') ?? randomUUID(),
    })
    return Response.json({ data: domain })
  } catch (error) {
    return identityErrorResponse(error)
  }
}
